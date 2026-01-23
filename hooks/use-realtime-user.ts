"use client";

import { useEffect } from 'react';
import { useUserStore } from '@/stores/user-store';
import { subscribeToUserChanges, unsubscribe } from '@/lib/supabase/realtime';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeUser(userId: string | null) {
  const updateUser = useUserStore((state) => state.updateUser);
  const setCredits = useUserStore((state) => state.setCredits);

  useEffect(() => {
    if (!userId) return;

    let channel: RealtimeChannel;

    try {
      channel = subscribeToUserChanges(userId, (updatedUser) => {
        // Update user store with realtime changes
        updateUser({
          credits: updatedUser.credits,
          plan: updatedUser.plan,
          role: updatedUser.role,
          name: updatedUser.name,
          avatarUrl: updatedUser.avatar_url,
        });

        // Sync credits specifically for real-time updates
        setCredits(updatedUser.credits);
      });
    } catch (error) {
      console.error('[useRealtimeUser] Subscription error:', error);
    }

    return () => {
      if (channel) {
        unsubscribe(channel);
      }
    };
  }, [userId, updateUser, setCredits]);
}
