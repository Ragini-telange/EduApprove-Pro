import React, { createContext, useContext, useState, useEffect } from 'react';
import { EduApproveDataService } from '../services/apiInterface';
import { getDataService, getDataServiceStatus } from '../services/dataServiceFactory';

interface DataContextType {
  dataService: EduApproveDataService;
  serviceStatus: { isLive: boolean; message: string };
  refreshKey: number;
  triggerRefresh: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataService] = useState<EduApproveDataService>(getDataService());
  const [serviceStatus, setServiceStatus] = useState(getDataServiceStatus());
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    setServiceStatus(getDataServiceStatus());
  }, [refreshKey]);

  return (
    <DataContext.Provider value={{ dataService, serviceStatus, refreshKey, triggerRefresh }}>
      {children}
    </DataContext.Provider>
  );
};

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
