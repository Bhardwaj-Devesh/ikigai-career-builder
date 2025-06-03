import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js'; // Import createClient
import { config } from '../config'; // Import config

const router = express.Router();

// Helper function to create a Supabase client with user's JWT (if provided)
const createSupabaseClient = (req: Request) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Extract JWT from "Bearer token"
  
  // Use anon key by default, but override with user's token if available
  return createClient(config.supabase.url, config.supabase.serviceRoleKey || config.supabase.anonKey!, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    },
     global: {
        headers: { 'Authorization': `Bearer ${token || config.supabase.anonKey}` }
    }
  });
};

// GET reports for a specific user
router.get('/user/:userId', async (req: Request, res: Response) => {
    const supabase = createSupabaseClient(req);

    try {
        const { userId: targetUserId } = req.params;

        const { data, error } = await supabase
            .from('ikigai_reports')
            .select(`
                id,
                created_at,
                report_type,
                report_data,
                ikigai_response_id,
                ikigai_responses!inner (
                    id,
                    user_id,
                    love,
                    good_at,
                    paid_for,
                    world_needs,
                    completed_at,
                    created_at,
                    updated_at
                )
            `)
            .eq('user_id', targetUserId);

        if (error) {
            console.error('Supabase Fetch User Reports Error:', error);
            if (error.message.includes('row-level security policy')) {
                return res.status(403).json({ error: 'Failed to fetch reports due to security policy.', success: false });
            }
            throw new Error(`Failed to fetch user reports: ${error.message}`);
        }

        // Transform the data to ensure ikigai_responses is not null
        const transformedData = data?.map(report => ({
            ...report,
            ikigai_responses: report.ikigai_responses || null
        })) || [];

        res.json({ success: true, data: transformedData });

    } catch (error: any) {
        console.error('Error in GET /api/reports/user/:userId:', error);
        res.status(500).json({ error: error.message, success: false });
    }
});

// GET a single report by ID
router.get('/report/:reportId', async (req: Request, res: Response) => {
  const supabase = createSupabaseClient(req);
  const { reportId } = req.params;

  try {
    const { data: report, error } = await supabase
      .from('ikigai_reports')
      .select(`
        id,
        generated_at,
        report_type,
        report_data,
        user_id,
        ikigai_response_id,
        ikigai_responses!inner (
          id,
          user_id,
          love,
          good_at,
          paid_for,
          world_needs,
          completed_at,
          created_at,
          updated_at
        )
      `)
      .eq('id', reportId)
      .single();

    if (error) {
      console.error('Error fetching report by ID:', error);
      if (error.message.includes('row-level security policy')) {
        return res.status(403).json({ error: 'Failed to fetch report due to security policy.', success: false });
      }
      throw new Error(`Failed to fetch report by ID: ${error.message}`);
    }

    if (!report) {
      return res.status(404).json({ error: 'Report not found', success: false });
    }

    // Ensure ikigai_responses is included, even if it's null due to data issues (though !inner should prevent this)
    const transformedReport = {
      id: report.id,
      created_at: report.generated_at,
      report_type: report.report_type,
      report_data: report.report_data,
      ikigai_responses: report.ikigai_responses || null
    };

    res.json({ 
      success: true, 
      data: transformedReport
    });

  } catch (error: any) {
    console.error('Error in GET /api/reports/report/:reportId:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

// POST endpoint to save a new report
router.post('/', async (req: Request, res: Response) => {
  const supabase = createSupabaseClient(req);
  const { userId, reportData, reportType = 'career_analysis' } = req.body;

  try {
    // First, create an ikigai_response entry to link the report to
    const { data: responseData, error: responseError } = await supabase
      .from('ikigai_responses')
      .insert([
        {
          user_id: userId,
          love: reportData.ikigaiAlignment?.strengthAreas?.[0] || '',
          good_at: reportData.skillAnalysis?.currentStrengths?.[0] || '',
          paid_for: reportData.careerRecommendations?.[0]?.title || '',
          world_needs: reportData.marketAnalysis?.opportunityAreas?.[0] || '',
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (responseError) {
      console.error('Error creating ikigai_response:', responseError);
      throw new Error(`Failed to create response: ${responseError.message}`);
    }

    // Then create the report entry linked to the response
    const { data: report, error: reportError } = await supabase
      .from('ikigai_reports')
      .insert([
        {
          ikigai_response_id: responseData.id,
          report_type: reportType,
          report_data: reportData,
          generated_at: new Date().toISOString(),
          user_id: userId
        }
      ])
      .select()
      .single();

    if (reportError) {
      console.error('Error creating report:', reportError);
      throw new Error(`Failed to create report: ${reportError.message}`);
    }

    res.json({ 
      success: true, 
      data: {
        id: report.id,
        created_at: report.generated_at,
        report_type: report.report_type
      }
    });

  } catch (error: any) {
    console.error('Error in POST /api/reports:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

export default router; 