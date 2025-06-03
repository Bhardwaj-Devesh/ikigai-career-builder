import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testResumeUpload() {
  try {
    // 1. First, get a test user
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;
    
    const testUser = users[0];
    if (!testUser) {
      throw new Error('No test user found');
    }

    // 2. Create form data with a test resume
    const formData = new FormData();
    const testResumePath = path.join(__dirname, 'test-resume.pdf');
    formData.append('resume', fs.createReadStream(testResumePath));

    // 3. Upload resume
    const response = await fetch('http://localhost:3000/api/resume/upload', {
      method: 'POST',
      headers: {
        'x-user-id': testUser.id,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    const result = await response.json();
    console.log('Upload Result:', result);

    // 4. Get the uploaded resume data
    const getResponse = await fetch(`http://localhost:3000/api/resume/user-resume/${testUser.id}`);
    const resumeData = await getResponse.json();
    console.log('Resume Data:', resumeData);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testResumeUpload(); 