import { X } from 'lucide-react';

interface AccessDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number | null;
  minRequired: number;
  isConnected: boolean;
}

export function AccessDeniedModal({
  isOpen,
  onClose,
  balance,
  minRequired,
  isConnected,
}: AccessDeniedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-krona text-white">Access Denied</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {!isConnected ? (
            <>
              <p className="text-gray-300 font-jost">
                Please connect your wallet to access the streaming platform.
              </p>
              <p className="text-sm text-gray-400 font-jost">
                You'll need at least {minRequired} AVAX in your wallet to proceed.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-300 font-jost">
                Your wallet doesn't have enough AVAX to access the streaming platform.
              </p>
              <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Your Balance:</span>
                  <span className="text-white font-chakra">
                    {balance?.toFixed(4)} AVAX
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Required:</span>
                  <span className="text-[#E70606] font-chakra">
                    {minRequired} AVAX
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                  <span className="text-gray-400">Needed:</span>
                  <span className="text-yellow-400 font-chakra">
                    {(minRequired - (balance || 0)).toFixed(4)} AVAX
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400 font-jost">
                Please add at least {(minRequired - (balance || 0)).toFixed(4)} more AVAX to your wallet to access the streaming site.
              </p>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-[#E70606] hover:bg-[#c00505] text-white px-6 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}
