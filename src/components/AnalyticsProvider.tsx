'use client';

import { useEffect } from 'react';
import { analyticsService } from '@/lib/analytics';

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    analyticsService.init();
  }, []);

  return <>{children}</>;
}