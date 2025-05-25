
import { create } from 'zustand';

export interface IkigaiResponse {
  love: string;
  goodAt: string;
  paidFor: string;
  worldNeeds: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface IkigaiStore {
  responses: IkigaiResponse;
  currentStep: number;
  messages: ChatMessage[];
  isTyping: boolean;
  isComplete: boolean;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateResponse: (field: keyof IkigaiResponse, value: string) => void;
  setTyping: (typing: boolean) => void;
  nextStep: () => void;
  reset: () => void;
}

export const useIkigaiStore = create<IkigaiStore>((set, get) => ({
  responses: {
    love: '',
    goodAt: '',
    paidFor: '',
    worldNeeds: '',
  },
  currentStep: 0,
  messages: [],
  isTyping: false,
  isComplete: false,
  addMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },
  updateResponse: (field, value) => {
    set((state) => ({
      responses: {
        ...state.responses,
        [field]: value,
      },
    }));
  },
  setTyping: (typing) => set({ isTyping: typing }),
  nextStep: () => {
    const { currentStep } = get();
    const newStep = currentStep + 1;
    set({ 
      currentStep: newStep,
      isComplete: newStep >= 4 
    });
  },
  reset: () => set({
    responses: { love: '', goodAt: '', paidFor: '', worldNeeds: '' },
    currentStep: 0,
    messages: [],
    isTyping: false,
    isComplete: false,
  }),
}));
