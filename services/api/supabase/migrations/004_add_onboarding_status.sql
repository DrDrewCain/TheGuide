-- Add onboarding_completed field to user_profiles
ALTER TABLE user_profiles
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN onboarding_skipped BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_version INTEGER DEFAULT 1;

-- Create index for faster queries
CREATE INDEX idx_user_profiles_onboarding ON user_profiles(onboarding_completed);

-- Add RLS policy to allow users to update their own onboarding status
CREATE POLICY "Users can update own onboarding status" ON user_profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, created_at, updated_at)
  VALUES (new.id, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing users to have user_profiles records
INSERT INTO user_profiles (id, created_at, updated_at, onboarding_completed)
SELECT
  id,
  created_at,
  NOW(),
  COALESCE((raw_user_meta_data->>'onboarding_completed')::boolean, FALSE)
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles);

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.onboarding_completed IS 'Whether the user has completed the initial onboarding flow';
COMMENT ON COLUMN user_profiles.onboarding_completed_at IS 'Timestamp when user completed onboarding';
COMMENT ON COLUMN user_profiles.onboarding_skipped IS 'Whether the user explicitly skipped onboarding';
COMMENT ON COLUMN user_profiles.onboarding_version IS 'Version of onboarding the user completed, for future updates';