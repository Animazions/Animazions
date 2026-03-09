/*
  # Create Storage Buckets for Video Generation

  1. New Storage Buckets
    - `reference-images`: Public bucket for storyboard and moodboard images
      uploaded before video generation so Pollinations API can fetch them by URL
    - `generated-videos`: Private bucket for storing generated video files
      accessible only by authenticated users who own them

  2. Security
    - reference-images: Public read, authenticated write with RLS
    - generated-videos: Authenticated read/write with ownership check via RLS

  3. Notes
    - Reference images are made public so external APIs (Pollinations) can fetch them
    - Videos are only accessible by the user who generated them
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reference-images',
  'reference-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-videos',
  'generated-videos',
  false,
  524288000,
  ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read reference images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reference-images');

CREATE POLICY "Authenticated users can upload reference images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'reference-images');

CREATE POLICY "Authenticated users can delete their reference images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'reference-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can read their generated videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'generated-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can upload generated videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'generated-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can delete their generated videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'generated-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
