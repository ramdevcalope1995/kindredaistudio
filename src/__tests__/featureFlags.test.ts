import { featureFlagService } from '../lib/featureFlags';

describe('Feature Flags Service', () => {
  beforeEach(() => {
    // Reset to defaults before each test
    featureFlagService['initializeFlags']();
  });

  test('should enable a feature that is globally on', () => {
    const isEnabled = featureFlagService.isEnabled('realtime_collaboration');
    expect(isEnabled).toBe(true);
  });

  test('should disable a feature that is globally off', () => {
    const isEnabled = featureFlagService.isEnabled('advanced_ai_models');
    expect(isEnabled).toBe(false);
  });

  test('should get a specific feature flag', () => {
    const flag = featureFlagService.getFlag('dark_mode');
    expect(flag).toBeDefined();
    expect(flag?.name).toBe('dark_mode');
    expect(flag?.enabled).toBe(true);
  });

  test('should update a feature flag', () => {
    featureFlagService.updateFlag('dark_mode', { enabled: false });
    const isEnabled = featureFlagService.isEnabled('dark_mode');
    expect(isEnabled).toBe(false);
  });

  test('should return all feature flags', () => {
    const allFlags = featureFlagService.getAllFlags();
    expect(allFlags).toHaveLength(6); // Based on the default flags
    expect(allFlags.some(flag => flag.name === 'realtime_collaboration')).toBe(true);
  });

  test('should respect rollout percentage for a user', () => {
    // This test verifies that the same user gets consistent results
    const userId = 'user-123';
    const featureName = 'advanced_ai_models'; // Has 10% rollout
    
    // Temporarily enable the feature for testing rollout logic
    featureFlagService.updateFlag(featureName, { enabled: true, rolloutPercentage: 10 });
    
    // Since this user's hash % 100 might be < 10, the result could be either true or false
    // But it should be consistent for the same user
    const result1 = featureFlagService.isEnabled(featureName, userId);
    const result2 = featureFlagService.isEnabled(featureName, userId);
    
    expect(result1).toBe(result2); // Should be consistent
  });
});