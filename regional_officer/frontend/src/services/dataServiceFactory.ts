import { EduApproveDataService } from './apiInterface';
import { MockEduApproveRepository } from './mockRepository';
import { checkSupabaseHealth } from './supabaseClient';

class DataServiceManager {
  private serviceInstance: EduApproveDataService;
  private isLive: boolean = false;
  private message: string = '';

  constructor() {
    const health = checkSupabaseHealth();
    if (health.isConfigured && health.isAvailable) {
      // Future live Supabase service integration
      this.serviceInstance = new MockEduApproveRepository();
      this.isLive = true;
      this.message = 'Connected to Supabase PostgreSQL.';
    } else {
      this.serviceInstance = new MockEduApproveRepository();
      this.isLive = false;
      this.message = health.errorReason || 'Running in isolated Mock Provider mode (Supabase unconfigured or offline).';
    }
  }

  public getService(): EduApproveDataService {
    return this.serviceInstance;
  }

  public getStatus() {
    return {
      isLive: this.isLive,
      message: this.message,
    };
  }
}

const manager = new DataServiceManager();

export function getDataService(): EduApproveDataService {
  return manager.getService();
}

export function getDataServiceStatus() {
  return manager.getStatus();
}
