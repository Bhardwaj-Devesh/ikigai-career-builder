
import { ChatMessage } from '@/store/ikigaiStore';
import { TypingAnimation } from './TypingAnimation';
import { useState } from 'react';

interface MessageBubbleProps {
  message: ChatMessage;
  showTyping?: boolean;
  onTypingComplete?: () => void;
}

export const MessageBubble = ({ message, showTyping = false, onTypingComplete }: MessageBubbleProps) => {
  const [typingComplete, setTypingComplete] = useState(!showTyping);

  const handleTypingComplete = () => {
    setTypingComplete(true);
    onTypingComplete?.();
  };

  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
          message.type === 'user'
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            : 'bg-white shadow-lg border border-gray-100 text-gray-800'
        }`}
      >
        {showTyping && !typingComplete ? (
          <TypingAnimation 
            text={message.content} 
            onComplete={handleTypingComplete}
            speed={20}
          />
        ) : (
          <p className="text-sm leading-relaxed">{message.content}</p>
        )}
      </div>
    </div>
  );
};
