import { X } from 'lucide-react';
import { useConnect } from '@thirdweb-dev/react';
import { Avalanche, Ethereum, Polygon, Arbitrum, Optimism } from '@thirdweb-dev/chains';
import { useState } from 'react';

interface NetworkSelectorProps {
  onClose: () => void;
}

const networks = [
  { chain: Avalanche, name: 'Avalanche', icon: '🏔️' },
  { chain: Ethereum, name: 'Ethereum', icon: '⟠' },
  { chain: Polygon, name: 'Polygon', icon: '⬡' },
  { chain: Arbitrum, name: 'Arbitrum', icon: '🔵' },
  { chain: Optimism, name: 'Optimism', icon: '🔴' },
];

export function NetworkSelector({ onClose }: NetworkSelectorProps) {
  const connect = useConnect();
  const [error, setError] = useState<string | null>(null);

  const handleSelectNetwork = async (chain: any) => {
    try {
      setError(null);
      connect({ chain });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to switch network. Please try again.');
      console.error('Failed to switch chain:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-3xl max-w-md w-full overflow-hidden">
        <div className="bg-[#E70606] px-6 py-4 flex items-center justify-between">
          <h2 className="font-krona text-xl uppercase">Select Network</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-gray-300 font-jost mb-4">
            Choose a blockchain network to get started
          </p>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm font-jost">
              {error}
            </div>
          )}

          {networks.map(({ chain, name, icon }) => (
            <button
              key={name}
              onClick={() => handleSelectNetwork(chain)}
              className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-[#E70606] rounded-xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl w-10 text-center">{icon}</span>
                <div className="text-left flex-1">
                  <h3 className="font-jost font-bold group-hover:text-[#E70606] transition-colors">
                    {name}
                  </h3>
                  <p className="text-gray-400 text-sm font-jost">
                    Switch to {name}
                  </p>
                </div>
              </div>
            </button>
          ))}

          <div className="pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center font-jost">
              You can change networks anytime after selection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
