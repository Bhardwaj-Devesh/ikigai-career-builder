
import { ChatInterface } from '@/components/ChatInterface';
import { LandingPage } from '@/components/LandingPage';
import { IkigaiDiagram } from '@/components/IkigaiDiagram';
import { useAuth } from '@/components/AuthProvider';
import { useIkigaiStore } from '@/store/ikigaiStore';

const Index = () => {
  const { user, loading } = useAuth();
  const { isComplete } = useIkigaiStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">✨</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  CareerAI
                </h1>
                <p className="text-sm text-gray-600">Your Personalized Career Companion</p>
              </div>
            </div>
            
            {!isComplete && (
              <div className="hidden md:block">
                <span className="text-sm text-gray-500">Discover your Ikigai</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {/* Chat Interface */}
          <div className="lg:col-span-2 bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <ChatInterface />
          </div>

          {/* Ikigai Diagram Sidebar */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <IkigaiDiagram />
            
            {/* Inspirational Quote */}
            <div className="mt-8 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
              <blockquote className="text-sm text-gray-700 italic text-center">
                "The place where your needs, abilities, and desires intersect is your life's purpose."
              </blockquote>
              <p className="text-xs text-gray-500 text-center mt-2">- Ancient Japanese Wisdom</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
