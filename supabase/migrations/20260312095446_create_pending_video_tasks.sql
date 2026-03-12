/*
  # Create pending_video_tasks table

  ## Purpose
  Persists in-flight video generation task IDs so that if a user navigates away
  from the Create AI Animation page, the background polling can resume when they
  return, and completed videos are still added to their Generated Videos section.

  ## New Tables
  - `pending_video_tasks`
    - `id` (uuid, primary key)
    - `user_id` (uuid, FK → auth.users)
    - `project_id` (uuid, nullable FK → projects — links task to a specific project)
    - `task_id` (text) — the external task ID returned by Kling / Seedance
    - `model` (text) — 'kling' | 'seedance'
    - `status` (text) — 'pending' | 'success' | 'failed'
    - `video_url` (text, nullable) — filled in when generation completes
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled; users can only access their own rows
*/

CREATE TABLE IF NOT EXISTS pending_video_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  task_id text NOT NULL,
  model text NOT NULL DEFAULT 'seedance',
  status text NOT NULL DEFAULT 'pending',
  video_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pending_video_tasks_user_id_idx ON pending_video_tasks(user_id);
CREATE INDEX IF NOT EXISTS pending_video_tasks_status_idx ON pending_video_tasks(status);

ALTER TABLE pending_video_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pending tasks"
  ON pending_video_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pending tasks"
  ON pending_video_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending tasks"
  ON pending_video_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending tasks"
  ON pending_video_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
