import { useEffect, useRef } from 'react';
import { useIkigaiStore } from '@/store/ikigaiStore';
import { useAuth } from './AuthProvider';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { CareerReport } from './CareerReport';
import { Button } from '@/components/ui/button';

const IKIGAI_QUESTIONS = [
  "Hello! I'm your AI career companion. I'm here to help you discover your Ikigai - your reason for being. Let's start with the first question: What activities, subjects, or causes make you feel truly alive and passionate? What do you LOVE doing?",
  "Wonderful! Now let's explore your strengths. What are you naturally GOOD AT? Think about skills, talents, or abilities that others often compliment you on or that come easily to you.",
  "Great insights! Next, let's consider the practical side. What skills, services, or value can you offer that people would be willing to PAY FOR? This could be current abilities or ones you could develop.",
  "Perfect! Finally, let's think about impact. Based on your observations of the world around you, what do you believe the world NEEDS more of? What problems or gaps do you see that you feel called to address?"
];

const RESPONSE_KEYS = ['love', 'goodAt', 'paidFor', 'worldNeeds'] as const;

export const ChatInterface = () => {
  const { user, signOut } = useAuth();
  const {
    messages,
    currentStep,
    isTyping,
    isComplete,
    isGeneratingReport,
    addMessage,
    updateResponse,
    setTyping,
    nextStep,
    responses,
    setShowReport,
    setAnalysisReport,
    showReport,
    analysisReport,
  } = useIkigaiStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMessageSent = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with first question
    if (messages.length === 0 && user && !initialMessageSent.current) {
      initialMessageSent.current = true;
      setTimeout(() => {
        addMessage({
          type: 'ai',
          content: `Hello ${user.user_metadata?.full_name || user.email}! ${IKIGAI_QUESTIONS[0]}`,
        });
      }, 1000);
    }
  }, [user, messages.length]);

  const handleSendMessage = (message: string) => {
    if (currentStep >= 4) return;

    // Add user message
    addMessage({
      type: 'user',
      content: message,
    });

    // Update response in store
    const responseKey = RESPONSE_KEYS[currentStep];
    updateResponse(responseKey, message);

    // Move to next step
    nextStep();

    // Add AI response if not complete
    if (currentStep < 3) {
      setTyping(true);
      setTimeout(() => {
        addMessage({
          type: 'ai',
          content: IKIGAI_QUESTIONS[currentStep + 1],
        });
        setTyping(false);
      }, 1500);
    } else {
      // Final message
      setTimeout(() => {
        addMessage({
          type: 'ai',
          content: "🎉 Amazing! You've completed your Ikigai discovery journey. I can see the intersection of your passions, skills, purpose, and potential coming together beautifully. Your unique combination creates a powerful foundation for your career path. Ready to generate your personalized career analysis report?",
        });
      }, 1500);
    }
  };

  const handleGenerateAnalysis = async () => {
    if (!user) return;
    
    addMessage({
      type: 'ai',
      content: "🔄 Excellent! I'm now generating your comprehensive career analysis. This may take a moment as I analyze your responses, research market trends, and create personalized recommendations. Please wait while I work my magic..."
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          responses: {
            love: responses.love,
            goodAt: responses.goodAt,
            paidFor: responses.paidFor,
            worldNeeds: responses.worldNeeds
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate analysis');
      }

      const data = await response.json();
      setAnalysisReport(data.analysis);
      setShowReport(true);
    } catch (error) {
      console.error('Error generating analysis:', error);
      addMessage({
        type: 'ai',
        content: "I apologize, but I encountered an error while generating your analysis. Please try again later."
      });
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
        {/* Header with user info and logout */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}&background=random`}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm text-gray-700">
                Welcome, {user?.user_metadata?.full_name || user?.email}
              </span>
            </div>
            <Button onClick={signOut} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div key={message.id}>
              <MessageBubble
                message={message}
                showTyping={index === messages.length - 1 && message.type === 'ai'}
              />
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white shadow-lg border border-gray-100 rounded-2xl px-4 py-2 max-w-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          {isGeneratingReport && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg rounded-2xl px-6 py-4 max-w-md">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <div>
                    <p className="font-medium">Generating Your Career Analysis</p>
                    <p className="text-xs opacity-90">Analyzing market trends and opportunities...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {isComplete && !isGeneratingReport && (
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-4 rounded-lg text-center">
              <h3 className="font-semibold mb-2">🎯 Ikigai Discovery Complete!</h3>
              <p className="text-sm mb-3">Ready to unlock your personalized career roadmap?</p>
              <button 
                onClick={handleGenerateAnalysis}
                disabled={isGeneratingReport}
                className="bg-white text-gray-800 px-6 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingReport ? 'Generating...' : 'Generate Career Analysis'}
              </button>
            </div>
          </div>
        )}

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isTyping || isComplete}
          placeholder={isComplete ? "Analysis complete!" : "Share your thoughts..."}
        />
      </div>

      {showReport && analysisReport && (
        <CareerReport 
          analysis={analysisReport} 
          onClose={() => setShowReport(false)}
          showSaveButton={true}
        />
      )}
    </>
  );
};
