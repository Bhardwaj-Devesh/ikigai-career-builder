
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';

interface CareerReportProps {
  analysis: any;
  onClose: () => void;
}

export const CareerReport = ({ analysis, onClose }: CareerReportProps) => {
  const ikigaiData = [
    { name: 'Passion', score: analysis.ikigaiAlignment.passionScore },
    { name: 'Mission', score: analysis.ikigaiAlignment.missionScore },
    { name: 'Vocation', score: analysis.ikigaiAlignment.vocationScore },
    { name: 'Profession', score: analysis.ikigaiAlignment.professionScore },
  ];

  const skillsRadarData = analysis.skillAnalysis.prioritySkills.slice(0, 6).map((skill: any) => ({
    skill: skill.skill,
    importance: skill.importance === 'High' ? 90 : skill.importance === 'Medium' ? 60 : 30,
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Your Career Analysis Report</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Executive Summary */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-purple-600">Executive Summary</h3>
            <p className="text-gray-700 leading-relaxed bg-purple-50 p-4 rounded-lg">
              {analysis.executiveSummary}
            </p>
          </section>

          {/* Ikigai Alignment Chart */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-purple-600">Ikigai Alignment Score</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ikigaiData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <span className="text-2xl font-bold text-purple-600">
                  Overall Alignment: {analysis.ikigaiAlignment.overallAlignment}%
                </span>
              </div>
            </div>
          </section>

          {/* Career Recommendations */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-purple-600">Top Career Recommendations</h3>
            <div className="grid gap-4">
              {analysis.careerRecommendations.slice(0, 3).map((career: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">{career.title}</h4>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {career.matchScore}% Match
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{career.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Industry:</span>
                      <p className="text-gray-600">{career.industry}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Salary:</span>
                      <p className="text-gray-600">{career.salaryRange}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Growth:</span>
                      <p className="text-gray-600">{career.growthProjection}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Time to Entry:</span>
                      <p className="text-gray-600">{career.timeToEntry}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="font-medium text-gray-700">Required Skills:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {career.requiredSkills.map((skill: string, skillIndex: number) => (
                        <span key={skillIndex} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Skills Analysis */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-purple-600">Skills Analysis</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-gray-800">Priority Skills Radar</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={skillsRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Importance" dataKey="importance" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-gray-800">Current Strengths</h4>
                <ul className="space-y-2">
                  {analysis.skillAnalysis.currentStrengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      {strength}
                    </li>
                  ))}
                </ul>
                
                <h4 className="font-semibold mb-3 mt-6 text-gray-800">Skill Gaps to Address</h4>
                <ul className="space-y-2">
                  {analysis.skillAnalysis.skillGaps.map((gap: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Action Plan */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-purple-600">Your Action Plan</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  Immediate (Next 30 days)
                </h4>
                <ul className="space-y-2">
                  {analysis.actionPlan.immediate.map((action: any, index: number) => (
                    <li key={index} className="bg-red-50 p-3 rounded">
                      <p className="font-medium text-sm">{action.action}</p>
                      <p className="text-xs text-gray-600">{action.timeline}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  Short-term (3-6 months)
                </h4>
                <ul className="space-y-2">
                  {analysis.actionPlan.shortTerm.map((action: any, index: number) => (
                    <li key={index} className="bg-yellow-50 p-3 rounded">
                      <p className="font-medium text-sm">{action.action}</p>
                      <p className="text-xs text-gray-600">{action.timeline}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Long-term (1+ years)
                </h4>
                <ul className="space-y-2">
                  {analysis.actionPlan.longTerm.map((action: any, index: number) => (
                    <li key={index} className="bg-green-50 p-3 rounded">
                      <p className="font-medium text-sm">{action.action}</p>
                      <p className="text-xs text-gray-600">{action.timeline}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Market Analysis */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-purple-600">Market Analysis</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-800">Industry Trends</h4>
                <ul className="space-y-2">
                  {analysis.marketAnalysis.industryTrends.map((trend: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2"></span>
                      <span className="text-sm">{trend}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-800">Opportunity Areas</h4>
                <ul className="space-y-2">
                  {analysis.marketAnalysis.opportunityAreas.map((area: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2"></span>
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-gray-800">Demand Forecast</h4>
              <p className="text-sm text-gray-700">{analysis.marketAnalysis.demandForecast}</p>
            </div>
          </section>

          {/* Personality Insights */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-purple-600">Personality & Work Style Insights</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Work Style</h4>
                  <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded">
                    {analysis.personalityInsights.workStyle}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Ideal Work Environment</h4>
                  <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                    {analysis.personalityInsights.idealWorkEnvironment}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Motivation Factors</h4>
                  <ul className="space-y-1">
                    {analysis.personalityInsights.motivationFactors.map((factor: string, index: number) => (
                      <li key={index} className="text-sm flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Potential Challenges</h4>
                  <ul className="space-y-1">
                    {analysis.personalityInsights.potentialChallenges.map((challenge: string, index: number) => (
                      <li key={index} className="text-sm flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Download/Export Actions */}
          <section className="border-t pt-6">
            <div className="flex flex-wrap gap-4 justify-center">
              <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                Download PDF Report
              </button>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Share Report
              </button>
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                Save to Profile
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
