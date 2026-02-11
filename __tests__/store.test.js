import { getWorkflows, getWorkflowBySlug } from '../lib/store';

describe('store', () => {
  test('getWorkflows returns array of workflows', () => {
    const workflows = getWorkflows({});
    expect(Array.isArray(workflows)).toBe(true);
    expect(workflows.length).toBeGreaterThan(0);
  });

  test('each workflow has required fields', () => {
    const workflows = getWorkflows({});
    for (const w of workflows) {
      expect(w).toHaveProperty('id');
      expect(w).toHaveProperty('slug');
      expect(w).toHaveProperty('name');
      expect(w).toHaveProperty('description');
      expect(w).toHaveProperty('inputs_schema');
    }
  });

  test('getWorkflowBySlug finds existing workflow', () => {
    const workflow = getWorkflowBySlug('bug-triage');
    expect(workflow).toBeTruthy();
    expect(workflow.slug).toBe('bug-triage');
  });

  test('getWorkflowBySlug returns undefined for missing slug', () => {
    const workflow = getWorkflowBySlug('nonexistent-workflow');
    expect(workflow).toBeFalsy();
  });

  test('getWorkflows filters by category', () => {
    const workflows = getWorkflows({});
    if (workflows.length > 0) {
      const category = workflows[0].category;
      const filtered = getWorkflows({ category });
      expect(filtered.length).toBeGreaterThan(0);
      for (const w of filtered) {
        expect(w.category).toBe(category);
      }
    }
  });

  test('getWorkflows filters by search', () => {
    const workflows = getWorkflows({});
    if (workflows.length > 0) {
      const search = workflows[0].name.split(' ')[0];
      const filtered = getWorkflows({ search });
      expect(filtered.length).toBeGreaterThan(0);
    }
  });
});
