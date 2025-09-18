-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE decision_type AS ENUM (
  'career_change',
  'job_offer',
  'relocation',
  'education',
  'home_purchase',
  'investment',
  'family_planning',
  'retirement',
  'business_startup'
);

CREATE TYPE decision_status AS ENUM (
  'draft',
  'analyzing',
  'simulated',
  'decided',
  'implemented',
  'archived'
);

CREATE TYPE simulation_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed'
);

CREATE TYPE marital_status AS ENUM (
  'single',
  'married',
  'divorced',
  'widowed'
);

-- User Profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER CHECK (age >= 18 AND age <= 120),
  city TEXT,
  state TEXT,
  country TEXT,
  zip_code TEXT,
  marital_status marital_status,
  dependents INTEGER DEFAULT 0 CHECK (dependents >= 0 AND dependents <= 20),
  current_role TEXT,
  industry TEXT,
  company TEXT,
  years_experience INTEGER CHECK (years_experience >= 0 AND years_experience <= 60),
  salary DECIMAL(12, 2) CHECK (salary >= 0),
  financial_data JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decisions table
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type decision_type NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  description TEXT CHECK (char_length(description) <= 2000),
  status decision_status DEFAULT 'draft',
  parameters JSONB DEFAULT '{}',
  constraints JSONB DEFAULT '[]',
  decision_deadline TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decision Options table
CREATE TABLE decision_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  description TEXT CHECK (char_length(description) <= 2000),
  parameters JSONB DEFAULT '{}',
  pros TEXT[] DEFAULT '{}',
  cons TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simulations table
CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES decision_options(id) ON DELETE CASCADE,
  status simulation_status DEFAULT 'pending',
  job_id TEXT,
  iterations INTEGER DEFAULT 1000,
  results JSONB,
  aggregate_metrics JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_decisions_user_id ON decisions(user_id);
CREATE INDEX idx_decisions_status ON decisions(status);
CREATE INDEX idx_decision_options_decision_id ON decision_options(decision_id);
CREATE INDEX idx_simulations_decision_id ON simulations(decision_id);
CREATE INDEX idx_simulations_option_id ON simulations(option_id);
CREATE INDEX idx_simulations_status ON simulations(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decision_options_updated_at BEFORE UPDATE ON decision_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulations_updated_at BEFORE UPDATE ON simulations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

-- User Profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = id);

-- Decisions policies
CREATE POLICY "Users can view own decisions" ON decisions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decisions" ON decisions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decisions" ON decisions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decisions" ON decisions
  FOR DELETE USING (auth.uid() = user_id);

-- Decision Options policies (inherit access from parent decision)
CREATE POLICY "Users can view options of own decisions" ON decision_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = decision_options.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage options of own decisions" ON decision_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = decision_options.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

-- Simulations policies (inherit access from parent decision)
CREATE POLICY "Users can view simulations of own decisions" ON simulations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = simulations.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create simulations for own decisions" ON simulations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = simulations.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own simulations" ON simulations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = simulations.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();