-- Create resumes table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create extracted_resume_data table
CREATE TABLE IF NOT EXISTS extracted_resume_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    json_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_insights table
CREATE TABLE IF NOT EXISTS saved_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_resume_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_insights ENABLE ROW LEVEL SECURITY;

-- Policies for resumes
CREATE POLICY "Users can view their own resumes"
    ON resumes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resumes"
    ON resumes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policies for extracted_resume_data
CREATE POLICY "Users can view their own resume data"
    ON extracted_resume_data FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resume data"
    ON extracted_resume_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policies for saved_insights
CREATE POLICY "Users can view their own insights"
    ON saved_insights FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights"
    ON saved_insights FOR INSERT
    WITH CHECK (auth.uid() = user_id); 