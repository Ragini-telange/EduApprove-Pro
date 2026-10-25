import { describe, it, expect } from 'vitest';
import { canTransitionStatus, getAvailableTransitions } from '../types/workflowTransitions';

describe('AICTE Workflow State Machine Transitions', () => {
  it('allows Regional Officer to move submitted application to under_scrutiny', () => {
    const res = canTransitionStatus('submitted', 'under_scrutiny', 'regional_officer');
    expect(res.allowed).toBe(true);
  });

  it('prohibits arbitrary status jump from submitted directly to completed', () => {
    const res = canTransitionStatus('submitted', 'completed', 'regional_officer');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('prohibited by AICTE workflow rules');
  });

  it('allows Regional Officer under scrutiny to request corrections', () => {
    const res = canTransitionStatus('under_scrutiny', 'correction_required', 'regional_officer');
    expect(res.allowed).toBe(true);
  });

  it('prohibits institution admin from moving under_scrutiny to under_next_stage', () => {
    const res = canTransitionStatus('under_scrutiny', 'under_next_stage', 'institution_admin');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('not authorised');
  });

  it('returns valid available transitions for regional officer under scrutiny', () => {
    const transitions = getAvailableTransitions('under_scrutiny', 'regional_officer');
    const targetStatuses = transitions.map((t) => t.targetStatus);
    expect(targetStatuses).toContain('correction_required');
    expect(targetStatuses).toContain('pending_evc');
    expect(targetStatuses).toContain('under_next_stage');
    // Regional officer cannot directly execute statutory final rejection
    expect(targetStatuses).not.toContain('rejected');
  });
});
