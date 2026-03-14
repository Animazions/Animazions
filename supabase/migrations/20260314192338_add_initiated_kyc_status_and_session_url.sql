/*
  # Add 'initiated' KYC status and session_url column

  ## Summary
  Extends the KYC status flow to distinguish between a session being created (initiated)
  and a submission actually being received by Didit (pending). Also stores the session_url
  so users can resume an incomplete verification.

  ## Changes
  - user_profiles: drop old check constraint on kyc_status, add new one including 'initiated'
  - user_profiles: add kyc_session_url column to store the Didit verification URL

  ## Notes
  - 'initiated' = session created, user has not yet submitted documents
  - 'pending' = submission received by Didit, awaiting review decision
  - The banner will show a "Resume KYC" button when status is 'initiated'
*/

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_kyc_status_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_kyc_status_check
  CHECK (kyc_status IN ('not_started', 'initiated', 'pending', 'approved', 'rejected'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'kyc_session_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN kyc_session_url text;
  END IF;
END $$;
