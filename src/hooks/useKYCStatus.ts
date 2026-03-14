import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type KYCStatus = 'not_started' | 'pending' | 'approved' | 'rejected';

interface KYCProfile {
  kyc_verified: boolean;
  kyc_status: KYCStatus;
  kyc_session_id: string | null;
  kyc_completed_at: string | null;
}

export function useKYCStatus() {
  const { user } = useAuth();
  const [kycProfile, setKycProfile] = useState<KYCProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchKYCStatus = useCallback(async () => {
    if (!user) {
      setKycProfile(null);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('kyc_verified, kyc_status, kyc_session_id, kyc_completed_at')
      .eq('id', user.id)
      .maybeSingle();

    setKycProfile(data ?? { kyc_verified: false, kyc_status: 'not_started', kyc_session_id: null, kyc_completed_at: null });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchKYCStatus();
  }, [fetchKYCStatus]);

  const startKYCSession = async (): Promise<{ session_url: string | null; error: string | null }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { session_url: null, error: 'Not authenticated' };

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-kyc-session`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let data: Record<string, unknown>;
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => '(unreadable)');
        return { session_url: null, error: `HTTP ${res.status} — non-JSON response: ${text}` };
      }

      if (!res.ok) {
        const detail = data.details ? `\n${data.details}` : '';
        return { session_url: null, error: `[${res.status}] ${data.error ?? 'Failed to start KYC'}${detail}` };
      }

      if (!data.session_url) {
        return { session_url: null, error: `No session_url in response: ${JSON.stringify(data)}` };
      }

      await fetchKYCStatus();
      return { session_url: data.session_url as string, error: null };
    } catch (err: unknown) {
      return { session_url: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return {
    kycProfile,
    loading,
    isVerified: kycProfile?.kyc_verified ?? false,
    kycStatus: kycProfile?.kyc_status ?? 'not_started',
    refetch: fetchKYCStatus,
    startKYCSession,
  };
}
