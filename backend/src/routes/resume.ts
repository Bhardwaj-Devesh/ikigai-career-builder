import express, { Request, Response } from 'express';
import multer from 'multer';
import { parseResume } from '../services/resumeParser';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

const router = express.Router();

// Helper function to create a Supabase client with user's JWT (if provided)
const createSupabaseClient = (req: Request) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Extract JWT from "Bearer token"
  
  if (!token) {
    throw new Error('No authorization token provided');
  }

  // Create two clients:
  // 1. One with service role for database operations
  // 2. One with user token for storage operations
  const dbClient = createClient(config.supabase.url, config.supabase.serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });

  // For storage operations, we need to use the user's JWT token
  // Create a client with anon key but override the auth header with user's token
  const storageClient = createClient(config.supabase.url, config.supabase.anonKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': config.supabase.anonKey // Required for storage operations
      }
    }
  });

  return {
    db: dbClient,
    storage: storageClient
  };
};

// Define the type for the request with multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

// Upload and parse resume
router.post('/upload', upload.single('resume'), async (req: MulterRequest, res: Response) => {
  let clients;
  try {
    // Create Supabase clients
    clients = createSupabaseClient(req);
    const { db: supabaseDb, storage: supabaseStorage } = clients;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get user ID from auth.uid() using storage client (which has user token)
    const { data: { user }, error: userError } = await supabaseStorage.auth.getUser();

    if (userError) {
      console.error('Supabase Auth Error in /upload:', {
        error: userError,
        message: userError.message
      });
      return res.status(401).json({ 
        error: 'Authentication failed', 
        details: userError.message,
        success: false 
      });
    }

    if (!user) {
      console.error('No user found in auth context');
      return res.status(401).json({ 
        error: 'User not authenticated', 
        success: false 
      });
    }

    const userId = user.id;
    const file = req.file;
    const fileId = uuidv4();
    const filePath = `${userId}/${fileId}-${file.originalname}`;

    // Upload file using storage client (with user token)
    const { data: uploadData, error: uploadError } = await supabaseStorage.storage
      .from('resumes')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabaseStorage.storage
      .from('resumes')
      .getPublicUrl(filePath);

    // Parse resume content
    const parsedData = await parseResume(file.buffer, file.mimetype);

    // Use the storage client (which has user JWT) for database operations to satisfy RLS
    const { data: resumeData, error: insertError } = await supabaseStorage
      .from('resumes')
      .insert({
        id: fileId,
        user_id: userId,
        file_name: file.originalname,
        file_path: filePath,
        file_type: file.mimetype,
        resume_url: publicUrl,
        parsed_data: parsedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      // If insert fails, try to clean up the uploaded file
      try {
        await supabaseStorage.storage
          .from('resumes')
          .remove([filePath]);
      } catch (cleanupError) {
        console.error('Failed to clean up uploaded file after insert error:', cleanupError);
      }
      throw new Error(`Failed to store resume data: ${insertError.message}`);
    }

    // Return success response with resume info
    res.json({ 
      success: true, 
      resume: {
        id: fileId,
        filename: file.originalname,
        uploadedAt: resumeData.created_at,
        downloadUrl: publicUrl,
        parsedData: parsedData
      }
    });
  } catch (error: any) {
    console.error('Error processing resume:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

// Get user's resume data
router.get('/user-resume/:userId', async (req: Request, res: Response) => {
    // Create Supabase clients
    const clients = createSupabaseClient(req);
    const { storage: supabaseStorage } = clients; // Use storage client for RLS

    try {
        const { userId: targetUserId } = req.params;

        // Get user from token to verify access
        const { data: { user }, error: userError } = await supabaseStorage.auth.getUser();
        
        if (userError || !user) {
            return res.status(401).json({ 
                error: 'Authentication failed', 
                success: false 
            });
        }

        // Only allow users to access their own resume data
        if (user.id !== targetUserId) {
            return res.status(403).json({ 
                error: 'Not authorized to access this resume', 
                success: false 
            });
        }

        const { data, error } = await supabaseStorage
            .from('resumes')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Handle the case when no resume exists
        if (error?.code === 'PGRST116') { // PGRST116 is the code for "no rows returned"
            return res.json({ 
                success: true, 
                resume: null,
                message: 'No resume found'
            });
        }

        // Handle other errors
        if (error) {
            console.error('Supabase Fetch Resume Data Error:', error);
            throw new Error(`Failed to fetch resume data: ${error.message}`);
        }

        // Return resume data if found
        res.json({ 
            success: true, 
            resume: {
                id: data.id,
                file_name: data.file_name,
                created_at: data.created_at,
                resume_url: data.resume_url,
                file_type: data.file_type,
                parsed_data: data.parsed_data
            }
        });

    } catch (error: any) {
        console.error('Error fetching resume data:', error);
        res.status(500).json({ error: error.message, success: false });
    }
});

export default router; 