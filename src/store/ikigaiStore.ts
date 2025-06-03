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
  generateAnalysis: (userId: string) => Promise<void>;
  setShowReport: (show: boolean) => void;
  setAnalysisReport: (report: any) => void;
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
  generateAnalysis: async (userId: string) => {
    const { responses } = get();
    set({ isGeneratingReport: true });

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      console.log('Saving responses for user:', userId);
      console.log('Responses data:', responses);
      
      // Save the responses with actual user ID
      const { data: responseData, error: responseError } = await supabase
        .from('ikigai_responses')
        .insert({
          user_id: userId,
          love: responses.love,
          good_at: responses.goodAt,
          paid_for: responses.paidFor,
          world_needs: responses.worldNeeds,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (responseError) {
        console.error('Database error:', responseError);
        throw new Error(`Failed to save responses: ${responseError.message}`);
      }

      console.log('Responses saved successfully:', responseData);

      // Call the analysis API
      const response = await fetch('https://ikigai-backend-36q9.onrender.com/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ikigaiResponseId: responseData.id,
          responses: responses
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis generation failed');
      }

      const analysisData = await response.json();

      if (!analysisData?.success) {
        console.error('Analysis data error:', analysisData);
        throw new Error(analysisData?.error || 'Analysis generation failed');
      }

      console.log('Analysis generated successfully:', analysisData.analysis);

      set({ 
        analysisReport: analysisData.analysis,
        isGeneratingReport: false,
        showReport: true 
      });

    } catch (error) {
      console.error('Error generating analysis:', error);
      set({ isGeneratingReport: false });
      throw error;
    }
  },
  setShowReport: (show) => set({ showReport: show }),
  setAnalysisReport: (report) => set({ analysisReport: report }),
}));
