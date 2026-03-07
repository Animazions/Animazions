import { useState } from 'react';
import { Play, TrendingUp, Users } from 'lucide-react';
import { useAvaxBalance } from '../hooks/useAvaxBalance';
import { AccessDeniedModal } from './AccessDeniedModal';

interface HeroProps {
  onNavigate: (page: string) => void;
}

export function Hero({ onNavigate }: HeroProps) {
  const [showAccessModal, setShowAccessModal] = useState(false);
  const { balance, loading, hasAccess, minRequired, isConnected } = useAvaxBalance();

  const handleStartWatching = () => {
    if (!isConnected) {
      setShowAccessModal(true);
      return;
    }

    if (!hasAccess) {
      setShowAccessModal(true);
      return;
    }

    onNavigate('streaming');
  };

  return (
    <section className="pt-32 pb-20 px-6 md:px-12 lg:px-24">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="font-krona text-4xl md:text-5xl lg:text-6xl leading-tight">
              THE FUTURE OF
              <span className="block text-[#E70606]">ANIMATION</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl font-jost max-w-xl">
              Experience Web 3.0 powered traditional and AI animation streaming and tokenization. Own, trade, create and showcase your favorite animations on the blockchain.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleStartWatching}
                disabled={loading}
                className={`px-8 py-4 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105 ${
                  loading
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-[#E70606] hover:bg-[#c00505]'
                } relative`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Checking Access
                  </span>
                ) : (
                  'Start Watching'
                )}
              </button>
              <button className="border border-white hover:bg-white hover:text-black px-8 py-4 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105">
                Learn More
              </button>
            </div>
            <div className="flex gap-8 pt-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#E70606]" />
                  <span className="font-krona text-2xl">10K+</span>
                </div>
                <p className="text-gray-400 text-sm font-chakra uppercase">Animations</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#E70606]" />
                  <span className="font-krona text-2xl">50K+</span>
                </div>
                <p className="text-gray-400 text-sm font-chakra uppercase">Creators</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700 relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <img
                src="https://animazions.com/wp-content/uploads/2025/10/Images-min.png"
                alt="Featured animation"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-20 h-20 bg-[#E70606] hover:bg-white hover:text-black rounded-full flex items-center justify-center transition-all group-hover:scale-110 border-4 border-white">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </button>
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="font-jost text-xl font-bold mb-2">Featured: Classic Animations</h3>
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <span className="font-chakra uppercase">Family Fun</span>
                  <span>•</span>
                  <span>12:34</span>
                  <span>•</span>
                  <span>5★</span>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#E70606] rounded-full blur-3xl opacity-50"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-600 rounded-full blur-3xl opacity-30"></div>
          </div>
        </div>
      </div>

      <AccessDeniedModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        balance={balance}
        minRequired={minRequired}
        isConnected={isConnected}
      />
    </section>
  );
}
