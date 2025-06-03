import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import resumeRoutes from './routes/resume';
import reportsRoutes from './routes/reports';
import { config, supabase } from './config';

const app = express();
app.use(express.json());

// Update CORS configuration to allow your Vercel frontend
app.use(cors({
  origin: config.server.frontendUrl,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

// Mount resume routes
app.use('/api/resume', resumeRoutes);

// Mount reports routes
app.use('/api/reports', reportsRoutes);

interface IkigaiAnalysisRequest {
  ikigaiResponseId: string;
  responses: {
    love: string;
    goodAt: string;
    paidFor: string;
    worldNeeds: string;
  };
}

// UUID validation function
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function to extract valid JSON from text
function extractValidJson(text: string): string {
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No valid JSON boundaries found');
  }
  return text.slice(jsonStart, jsonEnd + 1);
}

// Helper function to validate and parse JSON with retries
async function parseGroqResponse(response: any, maxRetries: number = 1): Promise<any> {
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts <= maxRetries) {
    try {
      const rawText = response.choices?.[0]?.message?.content;
      console.log('Raw Groq content:', rawText);
      
      const cleanJsonString = extractValidJson(rawText);
      return JSON.parse(cleanJsonString);
    } catch (error) {
      lastError = error as Error;
      console.error(`JSON parsing attempt ${attempts + 1} failed:`, error);
      
      if (attempts < maxRetries) {
        // Retry with a more explicit prompt
        const retryResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-r1-distill-llama-70b',
            messages: [
              {
                role: 'system',
                content: `You are an expert career analyst and executive coach. 
                Always respond with strictly valid JSON. Do not include markdown (like triple backticks), explanations, or comments. 
                Only respond with a single JSON object as output. 
                Make sure all JSON syntax is valid (no trailing commas, properly quoted keys, correct data types).
                
                Example of valid response format:
                {
                  "executiveSummary": "A compelling summary",
                  "ikigaiAlignment": {
                    "passionScore": 85,
                    "missionScore": 90
                  }
                }`
              },
              {
                role: 'user',
                content: 'Please provide the career analysis in valid JSON format only.'
              }
            ],
            temperature: 0.5, // Lower temperature for more consistent output
            max_tokens: 8000,
          }),
        });

        if (!retryResponse.ok) {
          throw new Error(`Groq API retry failed: ${retryResponse.status}`);
        }

        response = await retryResponse.json();
      }
      attempts++;
    }
  }

  throw new Error(`Failed to parse JSON after ${maxRetries + 1} attempts: ${lastError?.message}`);
}

app.post('/analyze', async (req: Request, res: Response) => {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      throw new Error('Required environment variables are not configured');
    }

    console.log('Starting career analysis generation...');

    const { ikigaiResponseId, responses }: IkigaiAnalysisRequest = req.body;

    // Validate or generate UUID
    const validResponseId = isValidUUID(ikigaiResponseId) ? ikigaiResponseId : uuidv4();
    console.log('Using response ID:', validResponseId);

    // First, store the ikigai responses
    console.log('Storing ikigai responses...');
    /* Commenting out database operations for testing
    const { error: responseError } = await supabase
      .from('ikigai_responses')
      .insert({
        id: validResponseId,
        love: responses.love,
        good_at: responses.goodAt,
        paid_for: responses.paidFor,
        world_needs: responses.worldNeeds,
        user_id: req.headers['x-user-id']
      });

    if (responseError) {
      console.error('Error storing ikigai responses:', responseError);
      throw new Error(`Failed to store ikigai responses: ${responseError.message}`);
    }
    */
    console.log('Analysis request for:', validResponseId);
    console.log('Responses:', responses);

    // Enhanced analysis prompt for comprehensive career guidance
    const analysisPrompt = `
You are a team of world-class career analysts, executive coaches, and industry researchers with 20+ years of experience. Analyze the following Ikigai responses and create a comprehensive, actionable career analysis.

IKIGAI RESPONSES:
- What they LOVE: ${responses.love}
- What they're GOOD AT: ${responses.goodAt}
- What they can be PAID FOR: ${responses.paidFor}
- What the world NEEDS: ${responses.worldNeeds}

Provide a detailed analysis in JSON format with this exact structure:
{
  "executiveSummary": "A compelling 4-5 sentence summary highlighting their unique value proposition and career potential. Make it inspiring and specific.",
  "ikigaiAlignment": {
    "passionScore": (0-100),
    "missionScore": (0-100),
    "vocationScore": (0-100),
    "professionScore": (0-100),
    "overallAlignment": (0-100),
    "strengthAreas": ["area1", "area2", "area3"],
    "improvementAreas": ["area1", "area2"]
  },
  "careerRecommendations": [
    {
      "title": "Specific Job Title",
      "description": "Detailed 3-4 sentence description of role and daily activities",
      "matchScore": (0-100),
      "industry": "Specific industry name",
      "salaryRange": "$X - $Y (realistic current market rates)",
      "growthProjection": "High/Medium/Low with specific % if available",
      "requiredSkills": ["skill1", "skill2", "skill3"],
      "timeToEntry": "X months/years with specific pathway",
      "companies": ["Company1", "Company2", "Company3"],
      "remoteOptions": "High/Medium/Low"
    }
  ],
  "skillAnalysis": {
    "currentStrengths": ["strength1", "strength2", "strength3"],
    "transferableSkills": ["skill1", "skill2", "skill3"],
    "skillGaps": ["gap1", "gap2", "gap3"],
    "prioritySkills": [
      {
        "skill": "Specific skill name",
        "importance": "Critical/High/Medium",
        "timeToLearn": "X months",
        "learningPath": "Specific courses, certifications, or methods",
        "cost": "$X or Free"
      }
    ]
  },
  "marketAnalysis": {
    "industryTrends": ["trend1 with specific data", "trend2 with growth %"],
    "opportunityAreas": ["emerging area1", "growing sector2"],
    "competitorAnalysis": "Specific insights about competition and differentiation strategies",
    "demandForecast": "Detailed forecast with specific projections for next 3-5 years",
    "salaryTrends": "Current and projected salary movements",
    "geographicHotspots": ["City1", "City2", "Remote"]
  },
  "actionPlan": {
    "immediate": [
      {
        "action": "Very specific actionable step",
        "timeline": "X weeks",
        "priority": "Critical/High/Medium",
        "resources": ["resource1", "resource2"]
      }
    ],
    "shortTerm": [
      {
        "action": "Specific 3-6 month goal",
        "timeline": "X months",
        "priority": "Critical/High/Medium",
        "milestones": ["milestone1", "milestone2"]
      }
    ],
    "longTerm": [
      {
        "action": "Specific 1-3 year strategic goal",
        "timeline": "X years",
        "priority": "High/Medium",
        "successMetrics": ["metric1", "metric2"]
      }
    ]
  },
  "personalityInsights": {
    "workStyle": "Detailed description of optimal work environment and style",
    "motivationFactors": ["intrinsic motivator1", "extrinsic motivator2"],
    "potentialChallenges": ["challenge1 with mitigation", "challenge2 with solution"],
    "idealWorkEnvironment": "Specific environment description",
    "leadershipStyle": "Natural leadership approach",
    "communicationPreferences": "Optimal communication methods"
  },
  "networkingStrategy": {
    "targetConnections": ["specific role1", "industry expert2", "mentor type3"],
    "platforms": ["LinkedIn with strategy", "platform2", "industry forum3"],
    "events": ["conference type1", "meetup type2", "workshop type3"],
    "contentStrategy": "Specific content creation recommendations",
    "mentorshipPlan": "How to find and approach mentors"
  },
  "compensationGuidance": {
    "negotiationStrategies": ["strategy1", "strategy2"],
    "benefitsToConsider": ["benefit1", "benefit2", "benefit3"],
    "equityConsiderations": "Advice on equity vs salary",
    "careerProgression": "Typical progression path and timeline"
  }
}

Use current 2024 market data, be specific with numbers, companies, and actionable advice. Make recommendations highly personalized based on their specific responses.
`;

    console.log('Calling Groq API...');

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1-distill-llama-70b',
        messages: [
          {
            role: 'system',
            content: `You are an expert career analyst and executive coach. 
            Always respond with strictly valid JSON. Do not include markdown (like triple backticks), explanations, or comments. 
            Only respond with a single JSON object as output. 
            Make sure all JSON syntax is valid (no trailing commas, properly quoted keys, correct data types).
            
            Example of valid response format:
            {
              "executiveSummary": "A compelling summary",
              "ikigaiAlignment": {
                "passionScore": 85,
                "missionScore": 90
              }
            }`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errorText);
      throw new Error(`Groq API error: ${groqResponse.status} - ${errorText}`);
    }

    const groqData = await groqResponse.json();
    console.log('Groq response received');
    
    // Parse the response with retry logic
    const parsedAnalysis = await parseGroqResponse(groqData);
    console.log('Analysis parsed successfully');

    // Store analytics data
    console.log('Storing analytics data...');
    /* Commenting out database operations for testing
    const { error: analyticsError } = await supabase
      .from('ikigai_analytics')
      .insert({
        ikigai_response_id: validResponseId,
        passion_score: parsedAnalysis.ikigaiAlignment.passionScore,
        mission_score: parsedAnalysis.ikigaiAlignment.missionScore,
        vocation_score: parsedAnalysis.ikigaiAlignment.vocationScore,
        profession_score: parsedAnalysis.ikigaiAlignment.professionScore,
        skill_analysis: parsedAnalysis.skillAnalysis,
        market_analysis: parsedAnalysis.marketAnalysis,
        action_plan: parsedAnalysis.actionPlan,
        career_recommendations: parsedAnalysis.careerRecommendations,
        competitor_analysis: parsedAnalysis.marketAnalysis
      });

    if (analyticsError) {
      console.error('Analytics insert error:', analyticsError);
      throw new Error(`Failed to store analytics: ${analyticsError.message}`);
    } else {
      console.log('Analytics data stored successfully');
    }
    */

    // Store the comprehensive report
    console.log('Storing report data...');
    /* Commenting out database operations for testing
    const { data: reportData, error: reportError } = await supabase
      .from('ikigai_reports')
      .insert({
        ikigai_response_id: validResponseId,
        report_type: 'comprehensive',
        report_data: parsedAnalysis
      })
      .select()
      .single();

    if (reportError) {
      console.error('Report insert error:', reportError);
      throw new Error(`Failed to store report: ${reportError.message}`);
    }
    */

    console.log('Career analysis completed successfully');

    res.json({
      success: true,
      reportId: validResponseId, // Using the response ID instead of report ID
      analysis: parsedAnalysis
    });

  } catch (error: any) {
    console.error('Error in generate-career-analysis:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
});

// Start the server
const PORT = parseInt(config.server.port as string, 10) || 3000; // Ensure PORT is a number
// Revert to default behavior which should listen on all interfaces (IPv4 and IPv6)
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export the Express API
export default app; 