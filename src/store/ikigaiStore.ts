
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
  isGeneratingReport: boolean;
  analysisReport: any | null;
  showReport: boolean;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateResponse: (field: keyof IkigaiResponse, value: string) => void;
  setTyping: (typing: boolean) => void;
  nextStep: () => void;
  reset: () => void;
  generateAnalysis: () => Promise<void>;
  setShowReport: (show: boolean) => void;
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
  isGeneratingReport: false,
  analysisReport: null,
  showReport: false,
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
    isGeneratingReport: false,
    analysisReport: null,
    showReport: false,
  }),
  generateAnalysis: async () => {
    const { responses } = get();
    set({ isGeneratingReport: true });

    try {
      // First, save the responses to get an ID
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data: responseData, error: responseError } = await supabase
        .from('ikigai_responses')
        .insert({
          user_id: 'anonymous', // For now, using anonymous
          love: responses.love,
          good_at: responses.goodAt,
          paid_for: responses.paidFor,
          world_needs: responses.worldNeeds,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (responseError) {
        throw new Error(`Failed to save responses: ${responseError.message}`);
      }

      // Call the analysis function
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('generate-career-analysis', {
        body: {
          ikigaiResponseId: responseData.id,
          responses: responses
        }
      });

      if (analysisError) {
        throw new Error(`Analysis failed: ${analysisError.message}`);
      }

      if (!analysisData.success) {
        throw new Error(analysisData.error || 'Analysis generation failed');
      }

      set({ 
        analysisReport: analysisData.analysis,
        isGeneratingReport: false,
        showReport: true 
      });

    } catch (error) {
      console.error('Error generating analysis:', error);
      set({ 
        isGeneratingReport: false 
      });
      
      // Add error message to chat
      get().addMessage({
        type: 'ai',
        content: `I apologize, but there was an error generating your career analysis: ${error.message}. Please try again in a moment.`
      });
    }
  },
  setShowReport: (show) => set({ showReport: show }),
}));
