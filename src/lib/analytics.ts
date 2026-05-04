import posthog from 'posthog-js';

const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST;

class AnalyticsService {
  private initialized = false;

  public init(): void {
    if (!ANALYTICS_ENABLED || this.initialized) return;

    try {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        capture_pageview: true, // Disable automatic pageview capture, as we'll handle it manually
        capture_pageleave: true,
        // Enable debug mode in development
        debug: process.env.NODE_ENV === 'development',
      });

      this.initialized = true;
      console.log('Analytics service initialized');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  public capture(eventName: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      posthog.capture(eventName, properties);
    } catch (error) {
      console.error('Failed to capture event:', error);
    }
  }

  public identify(userId: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      posthog.identify(userId, properties);
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  public group(groupType: string, groupId: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      posthog.group(groupType, groupId, properties);
    } catch (error) {
      console.error('Failed to group:', error);
    }
  }

  public reset(): void {
    if (!this.initialized) return;

    try {
      posthog.reset();
    } catch (error) {
      console.error('Failed to reset analytics:', error);
    }
  }

  public pageView(path?: string): void {
    if (!this.initialized) return;

    try {
      posthog.capture('$pageview', {
        ...(path && { path }),
      });
    } catch (error) {
      console.error('Failed to capture pageview:', error);
    }
  }

  public register(properties: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      posthog.register(properties);
    } catch (error) {
      console.error('Failed to register properties:', error);
    }
  }

  public unregister(property: string): void {
    if (!this.initialized) return;

    try {
      posthog.unregister(property);
    } catch (error) {
      console.error('Failed to unregister property:', error);
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }
}

export const analyticsService = new AnalyticsService();

// Analytics events constants
export const AnalyticsEvents = {
  // User actions
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Project actions
  PROJECT_CREATED: 'project_created',
  PROJECT_OPENED: 'project_opened',
  PROJECT_SAVED: 'project_saved',
  PROJECT_DELETED: 'project_deleted',
  
  // AI actions
  AI_GENERATE_CLICKED: 'ai_generate_clicked',
  AI_GENERATION_STARTED: 'ai_generation_started',
  AI_GENERATION_SUCCESS: 'ai_generation_success',
  AI_GENERATION_FAILED: 'ai_generation_failed',
  
  // Code actions
  CODE_RUN_CLICKED: 'code_run_clicked',
  CODE_COPIED: 'code_copied',
  CODE_DOWNLOADED: 'code_downloaded',
  
  // UI interactions
  SIDEBAR_TOGGLED: 'sidebar_toggled',
  CONNECTOR_VIEWED: 'connector_viewed',
  FEATURE_USED: 'feature_used',
  
  // Error tracking
  ERROR_OCCURRED: 'error_occurred',
  
  // Session tracking
  SESSION_STARTED: 'session_started',
  SESSION_ENDED: 'session_ended',
} as const;

// React hook for using analytics
export const useAnalytics = () => {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    analyticsService.capture(eventName, properties);
  };

  const identifyUser = (userId: string, properties?: Record<string, any>) => {
    analyticsService.identify(userId, properties);
  };

  return {
    trackEvent,
    identifyUser,
    isInitialized: analyticsService.isInitialized,
  };
};