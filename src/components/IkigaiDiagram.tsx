
import { useIkigaiStore } from '@/store/ikigaiStore';

export const IkigaiDiagram = () => {
  const { responses, currentStep } = useIkigaiStore();

  const sections = [
    { key: 'love', label: 'What you LOVE', color: '#F59E0B', completed: !!responses.love },
    { key: 'goodAt', label: 'What you\'re GOOD AT', color: '#10B981', completed: !!responses.goodAt },
    { key: 'paidFor', label: 'What you can be PAID FOR', color: '#06B6D4', completed: !!responses.paidFor },
    { key: 'worldNeeds', label: 'What the world NEEDS', color: '#EC4899', completed: !!responses.worldNeeds },
  ];

  return (
    <div className="w-full max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Your Ikigai Journey</h3>
      
      <div className="relative">
        <svg viewBox="0 0 400 400" className="w-full h-auto">
          {/* Background circles */}
          <circle
            cx="150"
            cy="150"
            r="120"
            fill={sections[0].completed ? sections[0].color : '#F3F4F6'}
            opacity="0.6"
            className="transition-all duration-500"
          />
          <circle
            cx="250"
            cy="150"
            r="120"
            fill={sections[3].completed ? sections[3].color : '#F3F4F6'}
            opacity="0.6"
            className="transition-all duration-500"
          />
          <circle
            cx="150"
            cy="250"
            r="120"
            fill={sections[1].completed ? sections[1].color : '#F3F4F6'}
            opacity="0.6"
            className="transition-all duration-500"
          />
          <circle
            cx="250"
            cy="250"
            r="120"
            fill={sections[2].completed ? sections[2].color : '#F3F4F6'}
            opacity="0.6"
            className="transition-all duration-500"
          />
          
          {/* Center Ikigai circle */}
          <circle
            cx="200"
            cy="200"
            r="50"
            fill={currentStep >= 4 ? '#6366F1' : '#E5E7EB'}
            className="transition-all duration-500"
          />
          
          {/* Labels */}
          <text x="100" y="100" textAnchor="middle" className="fill-gray-700 text-xs font-medium">
            LOVE
          </text>
          <text x="300" y="100" textAnchor="middle" className="fill-gray-700 text-xs font-medium">
            NEED
          </text>
          <text x="100" y="320" textAnchor="middle" className="fill-gray-700 text-xs font-medium">
            GOOD AT
          </text>
          <text x="300" y="320" textAnchor="middle" className="fill-gray-700 text-xs font-medium">
            PAID FOR
          </text>
          <text x="200" y="205" textAnchor="middle" className="fill-white text-sm font-bold">
            Ikigai
          </text>
        </svg>
      </div>

      {/* Progress indicators */}
      <div className="mt-6 space-y-2">
        {sections.map((section, index) => (
          <div key={section.key} className="flex items-center space-x-3">
            <div
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                section.completed
                  ? 'bg-green-500 border-green-500'
                  : currentStep === index
                  ? 'border-blue-500 bg-blue-100'
                  : 'border-gray-300'
              }`}
            >
              {section.completed && (
                <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${section.completed ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
              {section.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
