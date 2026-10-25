import { useState } from 'react';
import { getRegionalOfficerService } from '../services';
import { ApplicationStatus, UserRole } from '../types';
import { canTransitionStatus } from '../../../types/workflowTransitions';

export function useWorkflowTransition() {
  const service = getRegionalOfficerService();
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeTransition = async (params: {
    applicationId: string;
    currentStatus: ApplicationStatus;
    targetStatus: ApplicationStatus;
    officerId: string;
    officerName: string;
    officerRole: UserRole;
    remarks: string;
    stageName: string;
  }) => {
    // Check permission & legality first
    const check = canTransitionStatus(params.currentStatus, params.targetStatus, params.officerRole);
    if (!check.allowed) {
      setError(check.reason || 'Transition prohibited by AICTE workflow.');
      return { success: false, error: check.reason };
    }

    setIsExecuting(true);
    setError(null);
    try {
      const result = await service.executeWorkflowTransition({
        applicationId: params.applicationId,
        targetStatus: params.targetStatus,
        officerId: params.officerId,
        officerName: params.officerName,
        officerRole: params.officerRole,
        remarks: params.remarks,
        stageName: params.stageName,
      });

      if (!result.success) {
        setError(result.error || 'Transition failed.');
      }
      return result;
    } catch (err: any) {
      const errMsg = err?.message || 'Unexpected failure during status transition.';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    executeTransition,
    isExecuting,
    error,
    clearError: () => setError(null),
  };
}
