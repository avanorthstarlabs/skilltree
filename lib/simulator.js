/**
 * Simulated workflow executor.
 * Generates deterministic output based on workflow type + input payload.
 * No real side effects — all execution is simulated for v1.
 */
import crypto from 'crypto';

function hashInputs(proposalId, inputs) {
  return crypto.createHash('sha256')
    .update(JSON.stringify({ proposalId, inputs }))
    .digest('hex')
    .slice(0, 12);
}

const simulators = {
  'bug-triage': (inputs, hash) => ({
    priority_score: (parseInt(hash, 16) % 9) + 1,
    category: inputs.severity === 'critical' ? 'P0 - Immediate' : inputs.severity === 'high' ? 'P1 - Urgent' : 'P2 - Normal',
    suggested_assignee: ['alice@team.com', 'bob@team.com', 'carol@team.com'][parseInt(hash, 16) % 3],
    estimated_effort: ['< 1 hour', '2-4 hours', '1-2 days', '3-5 days'][parseInt(hash, 16) % 4],
    recommendation: `Triaged "${inputs.title}" in ${inputs.component}: classified as ${inputs.severity} severity. Recommend immediate investigation based on component criticality and reported impact.`
  }),

  'weekly-status': (inputs, hash) => ({
    summary: `Weekly status for ${inputs.team_name} (${inputs.date_range}): Team delivered 3 key initiatives, resolved 12 tickets, and maintained 99.7% uptime.`,
    accomplishments: [
      'Completed API migration to v3 endpoints',
      'Shipped user notification preferences feature',
      'Reduced P95 latency by 18% on search queries'
    ],
    blockers: [
      'Waiting on security review for OAuth integration',
      'Database connection pool exhaustion during peak hours'
    ],
    next_week_priorities: [
      'Complete OAuth integration pending security approval',
      'Deploy connection pool scaling fix to production',
      'Begin sprint planning for Q1 feature set'
    ],
    metrics_snapshot: inputs.include_metrics ? {
      tickets_closed: 12,
      pr_merge_rate: '94%',
      uptime: '99.7%',
      avg_review_time: '4.2 hours'
    } : null
  }),

  'qa-checklist': (inputs, hash) => {
    const types = inputs.test_types || ['functional', 'edge-case', 'regression'];
    const checklist = [];
    if (types.includes('functional')) {
      checklist.push(
        `[Functional] Verify ${inputs.feature_name} loads correctly with default state`,
        `[Functional] Verify form submission with valid inputs produces expected result`,
        `[Functional] Verify success/error feedback is displayed to the user`
      );
    }
    if (types.includes('edge-case')) {
      checklist.push(
        `[Edge Case] Submit with maximum length inputs`,
        `[Edge Case] Submit with special characters and unicode`,
        `[Edge Case] Test concurrent submissions from multiple tabs`
      );
    }
    if (types.includes('regression')) {
      checklist.push(
        `[Regression] Verify existing workflows still function after changes`,
        `[Regression] Check navigation and routing remain intact`
      );
    }
    return {
      total_cases: checklist.length,
      categories: types.reduce((acc, t) => {
        acc[t] = checklist.filter(c => c.toLowerCase().includes(t.replace('-', ' '))).length;
        return acc;
      }, {}),
      checklist,
      coverage_notes: `Generated ${checklist.length} test cases for "${inputs.feature_name}" covering ${types.join(', ')} scenarios.`
    };
  },

  'onboarding-guide': (inputs, hash) => ({
    week_1_tasks: [
      'Complete HR onboarding and equipment setup',
      `Meet with ${inputs.department} team lead for role overview`,
      'Set up development environment and access credentials',
      'Review team documentation and architecture guides',
      'Shadow a team member on a current project'
    ],
    week_2_tasks: [
      'Complete first small task or bug fix independently',
      'Attend all standing team meetings and 1:1s',
      'Review and understand deployment pipeline',
      'Begin working on assigned onboarding project'
    ],
    key_contacts: [
      { name: 'Team Lead', role: `${inputs.department} Lead`, reason: 'Primary mentor and task assignment' },
      { name: 'HR Partner', role: 'People Operations', reason: 'Benefits, policies, and general questions' },
      { name: 'IT Support', role: 'Infrastructure', reason: 'Access, tools, and environment setup' }
    ],
    recommended_reading: [
      'Team Engineering Handbook',
      'Architecture Decision Records (ADRs)',
      'Incident Response Playbook',
      `${inputs.department} Team Charter`
    ],
    milestones: [
      { week: 1, milestone: 'Environment set up, first commit pushed' },
      { week: 2, milestone: 'First task completed and reviewed' },
      { week: 4, milestone: 'Independently handling tickets' },
      { week: 8, milestone: 'Contributing to sprint planning and design discussions' }
    ]
  }),

  'incident-summary': (inputs, hash) => ({
    executive_summary: `${inputs.severity.toUpperCase()} incident ${inputs.incident_id} affecting ${(inputs.affected_systems || []).join(', ') || 'core services'}. Incident has been resolved with root cause identified and remediation actions documented.`,
    root_cause: `Analysis of ${inputs.incident_id} indicates the primary cause was a cascading failure triggered by increased load on dependent services, compounded by insufficient circuit-breaking at the service boundary.`,
    impact: {
      duration: '47 minutes',
      affected_users: 'Approximately 12% of active users',
      data_loss: 'None',
      sla_impact: inputs.severity === 'sev1' ? 'SLA breach — credited affected customers' : 'Within SLA threshold'
    },
    timeline: [
      { time: 'T+0', event: 'Monitoring alerts triggered' },
      { time: 'T+5m', event: 'On-call engineer acknowledged' },
      { time: 'T+12m', event: 'Root cause identified' },
      { time: 'T+35m', event: 'Fix deployed to production' },
      { time: 'T+47m', event: 'Full recovery confirmed' }
    ],
    action_items: [
      'Implement circuit breaker on service boundary',
      'Add load-based autoscaling for affected service',
      'Improve monitoring alerts with earlier warning thresholds',
      'Schedule chaos engineering test for similar failure mode'
    ],
    lessons_learned: [
      'Circuit breakers would have limited blast radius significantly',
      'Runbook was outdated — update with current architecture',
      'Communication during incident was effective, maintain current process'
    ]
  })
};

export function simulateExecution(workflow, proposal) {
  const hash = hashInputs(proposal.id, proposal.input_payload);
  const simulator = simulators[workflow.slug];

  if (!simulator) {
    return {
      run_status: 'success',
      output_payload: {
        message: `Simulated execution of "${workflow.name}" completed successfully.`,
        inputs_received: Object.keys(proposal.input_payload),
        execution_hash: hash
      }
    };
  }

  try {
    const output = simulator(proposal.input_payload, hash);
    return { run_status: 'success', output_payload: output };
  } catch (err) {
    return {
      run_status: 'failed',
      output_payload: { error: err.message, execution_hash: hash }
    };
  }
}

export function createSignedIntent(proposal, approval) {
  const canonical = JSON.stringify({
    proposal_id: proposal.id,
    workflow_id: proposal.workflow_id,
    input_payload: proposal.input_payload,
    approved_by: approval.approved_by
  });
  const signature = crypto.createHash('sha256').update(canonical).digest('hex');
  return { canonical, signature };
}
