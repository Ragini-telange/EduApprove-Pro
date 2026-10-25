import { IRegionalOfficerDataService } from './regionalOfficerApi.interface';
import { RegionalOfficerMockService } from './regionalOfficerMock.service';
import { RegionalOfficerLiveService } from './regionalOfficerLive.service';

export type ServiceMode = 'mock' | 'live';

class RegionalOfficerServiceFactory {
  private static instance: IRegionalOfficerDataService;
  private static currentMode: ServiceMode = 'mock';

  public static getService(): IRegionalOfficerDataService {
    if (!this.instance) {
      // Default to live Supabase Statutory Gateway unless explicitly set to 'mock'
      const configuredMode = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DATA_SERVICE_MODE) as ServiceMode | undefined;
      this.currentMode = configuredMode === 'mock' ? 'mock' : 'live';

      if (this.currentMode === 'live') {
        this.instance = new RegionalOfficerLiveService();
      } else {
        this.instance = new RegionalOfficerMockService();
      }
    }
    return this.instance;
  }

  public static setMode(mode: ServiceMode): IRegionalOfficerDataService {
    this.currentMode = mode;
    if (mode === 'live') {
      this.instance = new RegionalOfficerLiveService();
    } else {
      this.instance = new RegionalOfficerMockService();
    }
    return this.instance;
  }

  public static getMode(): ServiceMode {
    return this.currentMode;
  }
}

export const getRegionalOfficerService = () => RegionalOfficerServiceFactory.getService();
export const setRegionalOfficerServiceMode = (mode: ServiceMode) => RegionalOfficerServiceFactory.setMode(mode);
export const getRegionalOfficerServiceMode = () => RegionalOfficerServiceFactory.getMode();
