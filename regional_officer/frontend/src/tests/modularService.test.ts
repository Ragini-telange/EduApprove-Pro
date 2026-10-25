import { describe, it, expect } from 'vitest';
import { getRegionalOfficerService, setRegionalOfficerServiceMode } from '../modules/regional-officer/services';

describe('Modular Regional Officer Data Access Layer', () => {
  it('defaults to mock service provider with synthetic data indicator', () => {
    const service = getRegionalOfficerService();
    const status = service.getProviderStatus();
    expect(status.isMock).toBe(true);
    expect(status.providerName).toContain('Mock');
  });

  it('retrieves applications via modular interface', async () => {
    const service = getRegionalOfficerService();
    const apps = await service.getApplications();
    expect(apps.length).toBeGreaterThan(0);
    expect(apps[0]).toHaveProperty('institution');
  });

  it('retrieves EVC records via modular interface', async () => {
    const service = getRegionalOfficerService();
    const evcVisits = await service.getEVCVisits();
    expect(evcVisits.length).toBeGreaterThan(0);
    expect(evcVisits[0]).toHaveProperty('committeeMembers');
  });

  it('safely throws error if live mode is forced without backend', async () => {
    setRegionalOfficerServiceMode('live');
    const liveService = getRegionalOfficerService();
    expect(liveService.getProviderStatus().isMock).toBe(false);

    await expect(liveService.getApplications()).rejects.toThrow();

    // Reset back to mock for subsequent tests
    setRegionalOfficerServiceMode('mock');
  });
});
