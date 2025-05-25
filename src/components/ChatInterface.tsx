
import { useEffect, useRef } from 'react';
import { useIkigaiStore } from '@/store/ikigaiStore';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

const IKIGAI_QUESTIONS = [
  "Hello! I'm your AI career companion. I'm here to help you discover your Ikigai - your reason for being. Let's start with the first question: What activities, subjects, or causes make you feel truly alive and passionate? What do you LOVE doing?",
  "Wonderful! Now let's explore your strengths. What are you naturally GOOD AT? Think about skills, talents, or abilities that others often compliment you on or that come easily to you.",
  "Great insights! Next, let's consider the practical side. What skills, services, or value can you offer that people would be willing to PAY FOR? This could be current abilities or ones you could develop.",
  "Perfect! Finally, let's think about impact. Based on your observations of the world around you, what do you believe the world NEEDS more of? What problems or gaps do you see that you feel called to address?"
];

const RESPONSE_KEYS = ['love', 'goodAt', 'paidFor', 'worldNeeds'] as const;

export const ChatInterface = () => {
  const {
    messages,
    currentStep,
    isTyping,
    isComplete,
    addMessage,
    updateResponse,
    setTyping,
    nextStep,
  } = useIkigaiStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with first question
    if (messages.length === 0) {
      setTimeout(() => {
        addMessage({
          type: 'ai',
          content: IKIGAI_QUESTIONS[0],
        });
      }, 1000);
    }
  }, []);

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

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div key={message.id} ref={index === messages.length - 1 ? lastMessageRef : undefined}>
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
        
        <div ref={messagesEndRef} />
      </div>

      {isComplete && (
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-4 rounded-lg text-center">
            <h3 className="font-semibold mb-2">🎯 Ikigai Discovery Complete!</h3>
            <p className="text-sm mb-3">Ready to unlock your personalized career roadmap?</p>
            <button className="bg-white text-gray-800 px-6 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors">
              Generate Career Analysis
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
  );
};
