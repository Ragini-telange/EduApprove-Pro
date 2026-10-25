import { useState, useEffect, useCallback } from 'react';
import { getRegionalOfficerService, ApplicationFilterOptions } from '../services';
import { Application, Notification } from '../types';
import { useAuth } from '../../../context/AuthContext';

export function useRegionalOfficerData(filters?: ApplicationFilterOptions) {
  const { user } = useAuth();
  const service = getRegionalOfficerService();
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerInfo, setProviderInfo] = useState(service.getProviderStatus());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [apps, notifs] = await Promise.all([
        service.getApplications(filters),
        service.getNotifications(user.role, user.id),
      ]);
      setApplications(apps);
      setNotifications(notifs);
      setProviderInfo(service.getProviderStatus());
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve regional cases.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, user.role, user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    applications,
    notifications,
    isLoading,
    error,
    providerInfo,
    refetch: fetchData,
  };
}
