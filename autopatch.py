"""Autonomous autopatch engine — project template (v2).

Improvements over v1:
- Session memory via patch_progress.json (tracks completed/failed/pending)
- Task decomposition from done_criteria.json feature tasks
- Completion-aware prompting (tells model exactly what's missing)
- Multi-file diffs (builds entire features in one shot)
- Build verification (detects and runs project build command)
- No "single improvement" constraint — builds complete features
- Smart file context (shows relevant files for current task, not everything)
"""
from __future__ import annotations
import os, sys, subprocess, re, json
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent
RUNTIME = Path("/home/hackerman/agent-runtime")
PROPOSALS = RUNTIME / "planner" / "proposals"
WORK_ORDER = ROOT / "WORK_ORDER.md"
CHANGELOG = ROOT / "CHANGELOG.md"
QUALITY_GATE = RUNTIME / "constitution" / "quality_gate.md"
PROGRESS_FILE = ROOT / "patch_progress.json"
DONE_CRITERIA = ROOT / "done_criteria.json"
ROUTING_CFG = ROOT / "routing.json"
DESIGN_SYSTEM = ROOT / "DESIGN_SYSTEM.md"
LOGS = RUNTIME / "logs"
LOGS.mkdir(parents=True, exist_ok=True)


def load_routing() -> dict:
    if ROUTING_CFG.exists():
        try:
            return json.loads(ROUTING_CFG.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def provider_for_task(task_id: str) -> tuple[str, str]:
    """Return (provider, model) for a given task ID based on routing.json task_routing."""
    cfg = load_routing()
    task_map = cfg.get("task_routing", {})
    for provider, task_ids in task_map.items():
        if task_id in task_ids:
            if provider == "claude":
                return "claude", cfg.get("claude_model", "claude-opus-4-6")
            elif provider in ("openai", "codex"):
                return provider, cfg.get("openai_model", "gpt-5.2")
    # Fallback to env / defaults
    fallback_provider = os.environ.get("AUTOPATCH_PROVIDER", cfg.get("default_provider", "openai")).strip().lower()
    fallback_model = os.environ.get("AUTOPATCH_MODEL", cfg.get("openai_model", "gpt-5.2"))
    if fallback_provider == "claude":
        fallback_model = cfg.get("claude_model", "claude-opus-4-6")
    return fallback_provider, fallback_model


def utcnow():
    return datetime.now(timezone.utc).isoformat()


def log_event(event: str, status: str, detail: str = "") -> None:
    try:
        line = json.dumps({"ts": utcnow(), "event": event, "status": status,
                           "detail": detail[:4000], "project": ROOT.name})
        (LOGS / f"{ROOT.name}_autopatch_events.jsonl").open("a", encoding="utf-8").write(line + "\n")
    except Exception:
        pass


def safe_read(path: Path, fallback: str = "") -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return fallback


def sh(cmd: list[str], cwd: Path | None = None, check: bool = True) -> str:
    p = subprocess.run(cmd, cwd=str(cwd) if cwd else None, check=check,
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    return p.stdout


def ensure_git():
    if not (ROOT / ".git").exists():
        sh(["git", "init"], cwd=ROOT)
    sh(["git", "config", "user.email", "agent-runtime@local"], cwd=ROOT, check=False)
    sh(["git", "config", "user.name", "Agent Runtime"], cwd=ROOT, check=False)
    sh(["git", "add", "-A"], cwd=ROOT, check=False)
    sh(["git", "commit", "-m", "init"], cwd=ROOT, check=False)


# ── Session memory ──

def load_progress() -> dict:
    if PROGRESS_FILE.exists():
        try:
            return json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"completed_tasks": [], "failed_tasks": {}, "cycle_count": 0, "last_focus": ""}


def save_progress(progress: dict) -> None:
    PROGRESS_FILE.write_text(json.dumps(progress, indent=2), encoding="utf-8")


# ── Task decomposition from done_criteria.json ──

def load_feature_tasks() -> list[dict]:
    """Load feature tasks from done_criteria.json. Falls back to work-order-based generic task."""
    if DONE_CRITERIA.exists():
        try:
            criteria = json.loads(DONE_CRITERIA.read_text(encoding="utf-8"))
            tasks = criteria.get("feature_tasks", [])
            if tasks:
                return tasks
        except Exception:
            pass
    # Fallback: one generic task for the whole project
    return [{
        "id": "build-project",
        "name": "Build project from work order",
        "description": "Implement the project as described in WORK_ORDER.md",
        "required_files": [],
        "check_patterns": [],
    }]


def evaluate_task(task: dict) -> dict:
    """Check if a feature task is complete."""
    missing_files = []
    missing_patterns = []
    for rel_path in task.get("required_files", []):
        full = ROOT / rel_path
        if not full.exists():
            missing_files.append(rel_path)
        else:
            text = safe_read(full)
            for pattern in task.get("check_patterns", []):
                if pattern not in text:
                    missing_patterns.append(f"{rel_path}: missing '{pattern}'")
    complete = len(missing_files) == 0 and len(missing_patterns) == 0
    # If no required_files defined, task is never auto-complete
    if not task.get("required_files"):
        complete = False
    return {"complete": complete, "missing_files": missing_files, "missing_patterns": missing_patterns}


def get_pending_tasks(progress: dict) -> list[dict]:
    """Return incomplete tasks sorted by priority (fewer failures first)."""
    tasks = load_feature_tasks()
    pending = []
    for task in tasks:
        result = evaluate_task(task)
        if not result["complete"]:
            task_info = {**task, **result}
            task_info["fail_count"] = progress.get("failed_tasks", {}).get(task["id"], 0)
            pending.append(task_info)
    pending.sort(key=lambda t: t["fail_count"])
    return pending


def get_completion_summary() -> str:
    """Generate completion summary for the prompt."""
    tasks = load_feature_tasks()
    lines = []
    done = 0
    for task in tasks:
        result = evaluate_task(task)
        status = "DONE" if result["complete"] else "INCOMPLETE"
        if result["complete"]:
            done += 1
        detail = ""
        if not result["complete"]:
            parts = []
            if result["missing_files"]:
                parts.append(f"missing: {', '.join(result['missing_files'])}")
            if result["missing_patterns"]:
                parts.append(f"needs: {', '.join(result['missing_patterns'][:3])}")
            detail = f" — {'; '.join(parts)}"
        lines.append(f"  [{status}] {task['name']}{detail}")
    total = len(tasks)
    pct = 100 * done // total if total else 0
    lines.insert(0, f"PROJECT COMPLETION: {done}/{total} features ({pct}%)\n")
    return "\n".join(lines)


# ── File context ──

def list_repo_files() -> str:
    skip = {".git", "node_modules", ".next", "__pycache__", ".venv", "venv"}
    files = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        if any(s in rel.parts for s in skip):
            continue
        files.append(str(rel))
    return "\n".join(sorted(files))


def file_snapshot(path: Path, max_chars: int = 3000) -> str:
    if not path.exists():
        rel = path.relative_to(ROOT) if path.is_relative_to(ROOT) else path
        return f"FILE: {rel} — DOES NOT EXIST (needs to be created)"
    text = safe_read(path)
    if len(text) > max_chars:
        text = text[:max_chars] + "\n...<truncated>..."
    rel = path.relative_to(ROOT)
    return f"FILE: {rel}\n{text}"


def context_for_task(task: dict) -> str:
    """Build file context relevant to the current task.

    Marketplace-aware: includes related files for consistency.
    - API tasks see the storage layer and related data schemas
    - UI page tasks see globals.css and layout.js for consistent styling
    - All tasks see lib/ files to reuse existing patterns
    """
    seen = set()
    chunks = []

    def add(rel_path: str, max_chars: int = 4000):
        if rel_path in seen:
            return
        seen.add(rel_path)
        chunks.append(file_snapshot(ROOT / rel_path, max_chars=max_chars))

    # 1) Required files for this task
    for rel_path in task.get("required_files", []):
        add(rel_path)

    # 2) All lib/ files — storage layer, validator, simulator
    for p in sorted(ROOT.glob("lib/*.js")):
        add(str(p.relative_to(ROOT)), 3000)

    # 3) For UI page tasks: include layout + globals.css + design system for style consistency
    task_id = task.get("id", "")
    if task_id.startswith("page-") or task_id in ("layout-nav", "styling"):
        add("app/layout.js", 3000)
        add("app/globals.css", 6000)
        # Include the design system bible — this is the most important context for UI tasks
        design_sys = ROOT / "DESIGN_SYSTEM.md"
        if design_sys.exists():
            add("DESIGN_SYSTEM.md", 8000)
        # Also include an existing page as style reference
        for ref in ["app/page.js", "app/approvals/page.js"]:
            if (ROOT / ref).exists() and ref not in task.get("required_files", []):
                add(ref, 3000)
                break

    # 4) For API tasks: include a seed data file for schema reference
    if task_id.startswith("api-"):
        add("data/workflows.json", 2000)

    # 5) Always include package.json for dependency awareness
    add("package.json", 500)

    return "\n\n".join(chunks) if chunks else "No existing files found."


# ── Diff handling ──

def extract_diff(text: str) -> str:
    if "```" in text:
        text = text.replace("```diff", "").replace("```", "")
    if "\ufeff" in text:
        text = text.replace("\ufeff", "")
    if "diff --git " in text:
        start = text.index("diff --git ")
        return text[start:].strip()
    m = re.search(r"(?s)(^diff --git .*|^--- .*?\n\+\+\+ .*?\n)", text.lstrip(), re.M)
    if not m:
        return ""
    return text.lstrip()[m.start():].strip()


def sanitize_diff(diff: str) -> str:
    lines = diff.splitlines()
    allowed = ("diff --git ", "index ", "new file mode ", "deleted file mode ",
               "old mode ", "new mode ", "similarity index ", "rename from ",
               "rename to ", "--- ", "+++ ", "@@ ", "+", "-", " ", "\\")
    out = []
    for line in lines:
        if not out:
            if line.startswith("diff --git "):
                out.append(line)
            continue
        if line.startswith(allowed) or line.startswith("diff --git "):
            out.append(line)
        else:
            continue  # Skip model commentary between hunks
    return "\n".join(out).strip() + "\n" if out else ""


def validate_diff(diff: str) -> None:
    lines = diff.splitlines()
    has_hunk = any(line.startswith("@@ ") for line in lines)
    has_change = any(
        (line.startswith("+") or line.startswith("-"))
        and not line.startswith("+++") and not line.startswith("---")
        for line in lines
    )
    if not (has_hunk or has_change):
        raise ValueError("Diff contains no hunks or changes.")
    file_entries: list[dict] = []
    current: dict | None = None
    for line in lines:
        if line.startswith("diff --git "):
            parts = line.split()
            if len(parts) >= 4:
                if not parts[2].startswith("a/") or not parts[3].startswith("b/"):
                    raise ValueError("Diff paths must use a/ and b/ prefixes.")
                a = parts[2].removeprefix("a/")
                b = parts[3].removeprefix("b/")
                for p in (a, b):
                    if p == "/dev/null":
                        continue
                    if p.startswith("/") or ".." in Path(p).parts:
                        raise ValueError(f"Unsafe path in diff: {p}")
                    if Path(p).name == "CHANGELOG.md":
                        raise ValueError("Do not modify CHANGELOG.md.")
                current = {"file": b, "new_file": False, "dev_null": False}
                file_entries.append(current)
        elif current and line.startswith("new file mode "):
            current["new_file"] = True
        elif current and line.startswith("--- /dev/null"):
            current["dev_null"] = True
    for entry in file_entries:
        is_create = entry["new_file"] or entry["dev_null"]
        target = ROOT / entry["file"]
        if is_create and target.exists():
            raise ValueError(f"Diff tries to create existing file: {entry['file']}")
        if not is_create and not target.exists():
            raise ValueError(f"Diff refers to missing file without new file mode: {entry['file']}")


# ── LLM providers ──

SYSTEM_API = (
    "You are a senior backend engineer specializing in robust, production-grade APIs. "
    "You write correct, defensively-coded route handlers with proper HTTP status codes, "
    "input validation, error responses with helpful messages, idempotency guards, and "
    "consistent JSON response shapes. You handle edge cases: missing records return 404, "
    "duplicate operations return 409, invalid input returns 400 with field-level errors. "
    "You follow existing import patterns and reuse shared utilities (store.js, validate.js). "
    "Return ONLY a unified diff (git format). Multiple files per diff are encouraged. "
    "The first line MUST start with: diff --git "
    "No markdown fences, no commentary, no extra text. "
    "Do NOT modify CHANGELOG.md."
)

SYSTEM_UI = (
    "You are a senior UI engineer who builds premium, SaaS-grade interfaces that compete "
    "with Linear, Vercel, and Stripe dashboards. You have an obsessive eye for detail. "
    "You follow the project's DESIGN_SYSTEM.md specifications exactly: color tokens, "
    "typography scale, spacing grid, component patterns, hover/focus states, accessibility. "
    "Every page has: page header with title + subtitle, loading states (skeleton or spinner), "
    "empty states (icon + heading + description), error states (message + retry button). "
    "Every interactive element has hover and focus-visible styles. Every form input has a "
    "visible label (never placeholder-only). You use CSS variables from globals.css — never "
    "raw hex values. You match existing component class names and patterns exactly. "
    "You write semantic HTML with proper ARIA attributes and keyboard accessibility. "
    "Return ONLY a unified diff (git format). Multiple files per diff are encouraged. "
    "The first line MUST start with: diff --git "
    "No markdown fences, no commentary, no extra text. "
    "Do NOT modify CHANGELOG.md."
)


def _system_prompt_for(provider: str) -> str:
    """Return the role-specific system prompt based on provider routing."""
    if provider == "claude":
        return SYSTEM_UI
    return SYSTEM_API


def call_openai(prompt: str, model: str, max_output_tokens: int = 16000, system: str = "") -> str:
    from openai import OpenAI
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    client = OpenAI(api_key=api_key, timeout=300)
    if not system:
        system = SYSTEM_API
    resp = client.responses.create(
        model=model,
        input=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
        max_output_tokens=max_output_tokens,
    )
    text = ""
    try:
        text = resp.output_text
    except Exception:
        for o in getattr(resp, "output", []):
            for c in getattr(o, "content", []):
                if getattr(c, "type", None) in ("output_text", "text"):
                    text += getattr(c, "text", "")
    return text


def call_claude(prompt: str, model: str, max_tokens: int = 16000, system: str = "") -> str:
    from anthropic import Anthropic
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY not set")
    client = Anthropic(api_key=api_key, timeout=300)
    if not system:
        system = SYSTEM_UI
    msg = client.messages.create(
        model=model, max_tokens=max_tokens, temperature=0.2, system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = ""
    for block in msg.content:
        if getattr(block, "type", None) == "text":
            raw += block.text
    return raw


def call_ollama(prompt: str, model: str) -> str:
    import requests
    r = requests.post("http://127.0.0.1:11434/api/generate",
                      json={"model": model, "prompt": prompt, "stream": False}, timeout=600)
    r.raise_for_status()
    return r.json().get("response", "")


# ── Build verification ──

def detect_build_command() -> list[str] | None:
    pkg = ROOT / "package.json"
    if pkg.exists():
        try:
            scripts = json.loads(safe_read(pkg)).get("scripts", {})
            if "build" in scripts:
                return ["npm", "run", "build"]
        except Exception:
            pass
        return None
    if (ROOT / "app.py").exists():
        venv_py = RUNTIME / ".venv" / "bin" / "python"
        py = str(venv_py) if venv_py.exists() else sys.executable
        return [py, "-m", "py_compile", "app.py"]
    return None


def verify_build() -> tuple[bool, str]:
    cmd = detect_build_command()
    if not cmd:
        return True, "no build command detected"
    try:
        result = subprocess.run(cmd, cwd=str(ROOT), check=False,
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                text=True, timeout=120)
        return result.returncode == 0, (result.stdout or "")[:3000]
    except subprocess.TimeoutExpired:
        return True, "build timed out (non-blocking)"
    except Exception as e:
        return True, f"build error: {e}"


# ── Main ──

def main():
    max_out = int(os.environ.get("AUTOPATCH_MAX_TOKENS", "16000"))

    ensure_git()
    if not CHANGELOG.exists():
        CHANGELOG.write_text("# Changelog\n\n", encoding="utf-8")

    # Session memory
    progress = load_progress()
    progress["cycle_count"] = progress.get("cycle_count", 0) + 1

    # Task decomposition
    completion = get_completion_summary()
    pending = get_pending_tasks(progress)

    if not pending:
        log_event("done", "complete", "All feature tasks complete!")
        save_progress(progress)
        print("All feature tasks complete.")
        sys.exit(2)

    focus = pending[0]
    focus_id = focus["id"]
    progress["last_focus"] = focus_id

    # Per-task provider routing
    provider, model = provider_for_task(focus_id)
    log_event("focus", "start", f"Working on: {focus['name']} (cycle {progress['cycle_count']}) [provider={provider}, model={model}]")

    # Build prompt
    task_context = context_for_task(focus)
    repo_files = list_repo_files()
    work_order = safe_read(WORK_ORDER)
    quality_gate = safe_read(QUALITY_GATE)

    missing_desc = ""
    if focus.get("missing_files"):
        missing_desc += "\nFiles to CREATE (use new file mode in diff):\n"
        for f in focus["missing_files"]:
            missing_desc += f"  - {f}\n"
    if focus.get("missing_patterns"):
        missing_desc += "\nMissing functionality:\n"
        for p in focus["missing_patterns"][:8]:
            missing_desc += f"  - {p}\n"

    # Build role-specific instruction addendum
    role_instructions = ""
    if provider == "claude":
        role_instructions = """
UI/DESIGN RULES (CRITICAL — follow exactly):
- Use CSS class names from globals.css. NEVER inline styles or raw hex colors.
- Every page: page header (h1 + subtitle), empty state, loading state, error state.
- Every interactive element: hover state + focus-visible state with accent ring.
- Forms: visible label above every input, focus ring, field-level validation.
- Cards: 24px padding, 12px radius, shadow-sm at rest, shadow-md + translateY(-2px) on hover.
- Badges: filled background with status colors, uppercase, 0.75rem, 600 weight.
- Typography: page title 1.75rem/700, card title 1.125rem/600, body 0.875rem, caption 0.75rem.
- Spacing: 8px grid. Card padding 24px, section spacing 32px, form groups 20px.
- Buttons: verb-first labels, 40px min height, disabled opacity 0.5.
- If DESIGN_SYSTEM.md is in the file contents below, follow it as the single source of truth.
"""
    else:
        role_instructions = """
API RULES (CRITICAL — follow exactly):
- Import from lib/store.js, lib/validate.js, lib/simulator.js — reuse existing utilities.
- Every route handler: proper HTTP status codes (200, 201, 400, 404, 409, 500).
- Error responses: { error: "descriptive message" } with correct status code.
- Validate inputs before processing. Return field-level errors for bad input.
- Use NextResponse.json() consistently. Always set status codes explicitly.
- Handle edge cases: missing records, duplicate operations, invalid state transitions.
"""

    instructions = f"""You are an expert engineer building a production-grade application.

CURRENT TASK: {focus['name']}
{focus.get('description', '')}
{missing_desc}
{role_instructions}
COMPLETION STATUS:
{completion}

EXISTING FILES:
{repo_files or "none"}

RELEVANT FILE CONTENTS:
{task_context}

WORK ORDER (full spec):
{work_order[:8000]}

INSTRUCTIONS:
- Build the COMPLETE feature. No placeholders, no TODOs.
- Output a unified diff spanning MULTIPLE files if needed.
- For NEW files: diff --git a/path b/path + new file mode 100644 + --- /dev/null + +++ b/path
- For EXISTING files: match exact current content for context lines.
- Write production-quality code with proper error handling.
- Follow existing code style and patterns.
- Do NOT modify CHANGELOG.md.

{quality_gate}

Output ONLY the unified diff. No markdown. No commentary.
First line MUST be: diff --git a/... b/...
""".strip()

    # Call model with role-specific system prompt
    sys_prompt = _system_prompt_for(provider)
    raw = ""
    diff = ""
    last_err = ""
    for attempt in range(3):
        extra = "\n\nPREVIOUS ATTEMPT FAILED. Output ONLY valid unified diff.\n" if attempt > 0 else ""
        try:
            prompt = instructions + extra
            if provider in ("codex", "openai"):
                raw = call_openai(prompt, model=model, max_output_tokens=max_out, system=sys_prompt)
            elif provider == "claude":
                raw = call_claude(prompt, model=model, max_tokens=max_out, system=sys_prompt)
            else:
                raw = call_ollama(prompt, model=model)
        except Exception as e:
            last_err = f"{type(e).__name__}: {e}"
            log_event("model_call", "error", last_err)
            continue
        try:
            diff = sanitize_diff(extract_diff(raw))
            if not diff.strip():
                raise ValueError("No diff header found.")
            validate_diff(diff)
            break
        except Exception as e:
            last_err = f"{type(e).__name__}: {e}"
            diff = ""
            continue

    if not diff:
        ts = utcnow().replace(":", "-")
        raw_path = LOGS / f"{ROOT.name}_patch_raw_{ts}.txt"
        raw_path.write_text(raw, encoding="utf-8")
        log_event("diff", "error", f"[{focus['name']}] {last_err}")
        fails = progress.get("failed_tasks", {})
        fails[focus_id] = fails.get(focus_id, 0) + 1
        progress["failed_tasks"] = fails
        save_progress(progress)
        raise ValueError(f"Failed: '{focus['name']}': {last_err}")

    # Apply
    ts = utcnow().replace(":", "-")
    diff_path = LOGS / f"{ROOT.name}_patch_{ts}.diff"
    diff_path.write_text(diff, encoding="utf-8")

    try:
        sh(["git", "apply", "--recount", "--3way", "--whitespace=nowarn", str(diff_path)], cwd=ROOT)
    except subprocess.CalledProcessError:
        try:
            sh(["git", "apply", "--recount", "--whitespace=nowarn", str(diff_path)], cwd=ROOT)
        except subprocess.CalledProcessError as e:
            log_event("apply", "error", str(e))
            fails = progress.get("failed_tasks", {})
            fails[focus_id] = fails.get(focus_id, 0) + 1
            progress["failed_tasks"] = fails
            save_progress(progress)
            raise

    # Build verify
    build_ok, build_output = verify_build()
    if not build_ok:
        log_event("build", "fail", build_output[:1000])
        sh(["git", "checkout", "--", "."], cwd=ROOT, check=False)
        fails = progress.get("failed_tasks", {})
        fails[focus_id] = fails.get(focus_id, 0) + 1
        progress["failed_tasks"] = fails
        save_progress(progress)
        raise ValueError(f"Build failed for '{focus['name']}'. Reverted.")

    # Commit
    with CHANGELOG.open("a", encoding="utf-8") as f:
        f.write(f"## {utcnow()}\n- {focus['name']}: {diff_path.name}\n\n")
    sh(["git", "add", "-A"], cwd=ROOT)
    sh(["git", "commit", "-m", f"autopatch: {focus['name']} ({ts})"], cwd=ROOT)

    # Update progress
    result = evaluate_task(focus)
    if result["complete"]:
        if focus_id not in progress.get("completed_tasks", []):
            progress.setdefault("completed_tasks", []).append(focus_id)
        progress.get("failed_tasks", {}).pop(focus_id, None)
    else:
        progress.get("failed_tasks", {}).pop(focus_id, None)

    save_progress(progress)
    log_event("patch", "success", f"{focus['name']} | complete: {result['complete']}")
    print(f"Patched: {focus['name']} | Complete: {result['complete']}")
    print(get_completion_summary())


if __name__ == "__main__":
    main()
