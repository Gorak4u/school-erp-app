import { useState, useEffect } from 'react';

export interface SubscriptionSummary {
  maxStudents: number | null;
  studentsUsed: number | null;
  status: 'loading' | 'ready' | 'error';
}

export const useSubscriptionLimits = () => {
  const [subscriptionSummary, setSubscriptionSummary] = useState<SubscriptionSummary>({
    maxStudents: null,
    studentsUsed: null,
    status: 'loading',
  });
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchSubscription = async () => {
      try {
        const res = await fetch('/api/subscription?cache=true');
        if (!res.ok) throw new Error('Failed to load subscription');
        
        const data = await res.json();
        
        if (mounted) {
          setSubscriptionSummary({
            maxStudents: data?.subscription?.maxStudents ?? null,
            studentsUsed: data?.subscription?.studentsUsed ?? null,
            status: 'ready',
          });
          setPlanError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setPlanError(err.message || 'Unable to load subscription details');
          setSubscriptionSummary(prev => ({ ...prev, status: 'error' }));
        }
      }
    };

    fetchSubscription();
    
    return () => {
      mounted = false;
    };
  }, []);

  const studentsUsed = subscriptionSummary.studentsUsed ?? 0;
  const maxStudents = subscriptionSummary.maxStudents ?? 0;
  const usagePercent = maxStudents > 0 ? Math.min(Math.round((studentsUsed / maxStudents) * 100), 100) : 0;
  const seatsRemaining = maxStudents > 0 ? Math.max(maxStudents - studentsUsed, 0) : null;
  const limitReached = seatsRemaining !== null && seatsRemaining <= 0;

  return {
    subscriptionSummary,
    planError,
    studentsUsed,
    maxStudents,
    usagePercent,
    seatsRemaining,
    limitReached,
  };
};
