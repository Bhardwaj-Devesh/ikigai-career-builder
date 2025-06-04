// / <reference lib="deno.ns" />
import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Environment variables with fallbacks
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ikigai-career.vercel.app';
const FRONTEND_URL_DEV = process.env.FRONTEND_URL_DEV || 'http://localhost:8081';
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: NODE_ENV === 'production' ? FRONTEND_URL : FRONTEND_URL_DEV,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey'],
  credentials: true
}));

// Log environment configuration
console.log('Environment:', NODE_ENV);
console.log('Frontend URL:', NODE_ENV === 'production' ? FRONTEND_URL : FRONTEND_URL_DEV);

interface IkigaiAnalysisRequest {
  ikigaiResponseId: string;
  responses: {
    love: string;
    goodAt: string;
    paidFor: string;
    worldNeeds: string;
  };
}

app.post('/analyze', async (req: Request, res: Response) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!groqApiKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Required environment variables are not configured');
    }

    console.log('Starting career analysis generation...');

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { ikigaiResponseId, responses }: IkigaiAnalysisRequest = req.body;

    console.log('Analysis request for:', ikigaiResponseId);
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
            content: 'You are an expert career analyst and executive coach. Always respond with valid JSON only, no additional text or markdown. Ensure all fields are properly filled with realistic, actionable data.'
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
    
    const analysisContent = groqData.choices[0].message.content;
    
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysisContent);
      console.log('Analysis parsed successfully');
    } catch (e) {
      console.error('Failed to parse Groq response:', analysisContent);
      throw new Error('Failed to parse analysis response');
    }

    // Store analytics data
    console.log('Storing analytics data...');
    const { error: analyticsError } = await supabase
      .from('ikigai_analytics')
      .insert({
        ikigai_response_id: ikigaiResponseId,
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
    } else {
      console.log('Analytics data stored successfully');
    }

    // Store the comprehensive report
    console.log('Storing report data...');
    const { data: reportData, error: reportError } = await supabase
      .from('ikigai_reports')
      .insert({
        ikigai_response_id: ikigaiResponseId,
        report_type: 'comprehensive',
        report_data: parsedAnalysis
      })
      .select()
      .single();

    if (reportError) {
      console.error('Report insert error:', reportError);
      throw new Error(`Failed to store report: ${reportError.message}`);
    }

    console.log('Career analysis completed successfully, report ID:', reportData.id);

    res.json({
      success: true,
      reportId: reportData.id,
      analysis: parsedAnalysis
    });

  } catch (error: unknown) {
    console.error('Error in generate-career-analysis:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      success: false
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Frontend URL: ${NODE_ENV === 'production' ? FRONTEND_URL : FRONTEND_URL_DEV}`);
});
