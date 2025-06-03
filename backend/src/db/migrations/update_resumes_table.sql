-- Add new columns to resumes table
ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS parsed_data JSONB;

-- Update existing rows to have parsed_data from extracted_resume_data
UPDATE resumes r
SET parsed_data = (
    SELECT json_data
    FROM extracted_resume_data erd
    WHERE erd.resume_id = r.id
    ORDER BY erd.created_at DESC
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1
    FROM extracted_resume_data erd
    WHERE erd.resume_id = r.id
);

-- Update existing rows to have resume_url
UPDATE resumes r
SET resume_url = (
    SELECT concat(
        'https://',
        (SELECT value FROM storage.buckets WHERE id = 'resumes'),
        '.supabase.co/storage/v1/object/public/resumes/',
        r.file_path
    )
);

-- Drop the extracted_resume_data table since we've migrated the data
DROP TABLE IF EXISTS extracted_resume_data CASCADE; 