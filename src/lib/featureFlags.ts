// Simple feature flag system
import React from 'react';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number; // 0-100 percentage of users who should get this feature
  audience?: string[]; // Specific user IDs or roles that should get this feature
}

// Default feature flags
const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    name: 'realtime_collaboration',
    enabled: true,
    description: 'Enable real-time code collaboration between users',
  },
  {
    name: 'voice_commands',
    enabled: true,
    description: 'Enable voice-to-code functionality',
  },
  {
    name: 'advanced_ai_models',
    enabled: false,
    description: 'Enable access to newer, more capable AI models',
    rolloutPercentage: 10, // Only 10% of users initially
  },
  {
    name: 'dark_mode',
    enabled: true,
    description: 'Enable dark mode UI theme',
  },
  {
    name: 'code_sharing',
    enabled: false,
    description: 'Enable ability to share code snippets with other users',
    rolloutPercentage: 5, // Beta feature for 5% of users
  },
  {
    name: 'multi_language_support',
    enabled: false,
    description: 'Enable support for generating code in multiple programming languages',
    rolloutPercentage: 15, // Early access for 15% of users
  },
];

class FeatureFlagService {
  private flags: Map<string, FeatureFlag>;

  constructor() {
    this.flags = new Map();
    this.initializeFlags();
  }

  private initializeFlags(): void {
    DEFAULT_FLAGS.forEach(flag => {
      this.flags.set(flag.name, flag);
    });
  }

  public isEnabled(featureName: string, userId?: string): boolean {
    const flag = this.flags.get(featureName);
    
    if (!flag) {
      return false;
    }

    // If feature is globally disabled, return false
    if (!flag.enabled) {
      // Check if this user is in the audience for this feature
      if (flag.audience && userId && flag.audience.includes(userId)) {
        return true;
      }

      // Check if this user should get the feature based on rollout percentage
      if (flag.rolloutPercentage !== undefined && userId) {
        const hash = this.generateHash(userId + featureName);
        return hash % 100 < flag.rolloutPercentage;
      }

      return false;
    }

    return true;
  }

  public getFlag(featureName: string): FeatureFlag | undefined {
    return this.flags.get(featureName);
  }

  public getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  public updateFlag(featureName: string, updates: Partial<FeatureFlag>): void {
    const existingFlag = this.flags.get(featureName);
    if (existingFlag) {
      this.flags.set(featureName, {
        ...existingFlag,
        ...updates,
      });
    }
  }

  private generateHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Create a singleton instance
export const featureFlagService = new FeatureFlagService();

// React hook for using feature flags
export const useFeatureFlag = (featureName: string, userId?: string): boolean => {
  return featureFlagService.isEnabled(featureName, userId);
};

// Higher-order component for feature-based rendering
export const withFeatureFlag = (WrappedComponent: React.ComponentType<any>, featureName: string, userId?: string) => {
  return (props: any) => {
    const isEnabled = useFeatureFlag(featureName, userId);
    
    if (!isEnabled) {
      return null; // Or return a fallback component
    }
    
    return <WrappedComponent {...props} />;
  };
};