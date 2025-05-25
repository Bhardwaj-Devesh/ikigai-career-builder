
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IkigaiAnalysisRequest {
  ikigaiResponseId: string;
  responses: {
    love: string;
    goodAt: string;
    paidFor: string;
    worldNeeds: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { ikigaiResponseId, responses }: IkigaiAnalysisRequest = await req.json();

    console.log('Starting career analysis for:', ikigaiResponseId);

    // Generate comprehensive career analysis using Groq
    const analysisPrompt = `
You are a team of 10 expert career analysts, life coaches, and industry researchers. Based on the following Ikigai responses, provide a comprehensive career analysis.

IKIGAI RESPONSES:
- What they LOVE: ${responses.love}
- What they're GOOD AT: ${responses.goodAt}
- What they can be PAID FOR: ${responses.paidFor}
- What the world NEEDS: ${responses.worldNeeds}

Provide a detailed analysis in JSON format with the following structure:
{
  "executiveSummary": "A compelling 3-4 sentence summary of their unique career potential",
  "ikigaiAlignment": {
    "passionScore": (0-100),
    "missionScore": (0-100),
    "vocationScore": (0-100),
    "professionScore": (0-100),
    "overallAlignment": (0-100)
  },
  "careerRecommendations": [
    {
      "title": "Career Title",
      "description": "Detailed description",
      "matchScore": (0-100),
      "industry": "Industry name",
      "salaryRange": "$X - $Y",
      "growthProjection": "High/Medium/Low",
      "requiredSkills": ["skill1", "skill2"],
      "timeToEntry": "X months/years"
    }
  ],
  "skillAnalysis": {
    "currentStrengths": ["strength1", "strength2"],
    "skillGaps": ["gap1", "gap2"],
    "prioritySkills": [
      {
        "skill": "Skill name",
        "importance": "High/Medium/Low",
        "timeToLearn": "X months",
        "learningPath": "Specific recommendations"
      }
    ]
  },
  "marketAnalysis": {
    "industryTrends": ["trend1", "trend2"],
    "opportunityAreas": ["area1", "area2"],
    "competitorAnalysis": "Key insights about market competition",
    "demandForecast": "Future demand projections"
  },
  "actionPlan": {
    "immediate": [
      {
        "action": "Specific action",
        "timeline": "X weeks",
        "priority": "High/Medium/Low"
      }
    ],
    "shortTerm": [
      {
        "action": "Specific action",
        "timeline": "X months",
        "priority": "High/Medium/Low"
      }
    ],
    "longTerm": [
      {
        "action": "Specific action",
        "timeline": "X years",
        "priority": "High/Medium/Low"
      }
    ]
  },
  "personalityInsights": {
    "workStyle": "Description of preferred work style",
    "motivationFactors": ["factor1", "factor2"],
    "potentialChallenges": ["challenge1", "challenge2"],
    "idealWorkEnvironment": "Description"
  },
  "networkingStrategy": {
    "targetConnections": ["type1", "type2"],
    "platforms": ["platform1", "platform2"],
    "events": ["event type1", "event type2"]
  }
}

Be specific, actionable, and insightful. Use real industry data and current market trends.
`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career analyst. Always respond with valid JSON only, no additional text.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    const analysisContent = groqData.choices[0].message.content;
    
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysisContent);
    } catch (e) {
      console.error('Failed to parse Groq response:', analysisContent);
      throw new Error('Failed to parse analysis response');
    }

    // Store analytics data
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
    }

    // Store the comprehensive report
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
      throw new Error(`Failed to store report: ${reportError.message}`);
    }

    console.log('Career analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      reportId: reportData.id,
      analysis: parsedAnalysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-career-analysis:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
