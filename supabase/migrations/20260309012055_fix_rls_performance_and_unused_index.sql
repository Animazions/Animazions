/*
  # Fix RLS Policy Performance and Remove Unused Index

  1. Changes
    - Drop and recreate all 4 RLS policies on `public.projects` to use `(select auth.uid())`
      instead of `auth.uid()` directly. This prevents re-evaluation per row and improves
      query performance at scale.
    - Drop unused index `idx_projects_created_at` on `public.projects`

  2. Security
    - No change in access control logic — only performance optimization
    - All policies continue to restrict access to authenticated users and their own rows
*/

DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP INDEX IF EXISTS idx_projects_created_at;
