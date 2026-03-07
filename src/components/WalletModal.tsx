import { X, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useConnect } from '@thirdweb-dev/react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

export function WalletModal({ isOpen, onClose, onConnect }: WalletModalProps) {
  const { connect, isConnecting } = useConnect();
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  const wallets = [
    { id: 'io.metamask', name: 'MetaMask', icon: '🦊' },
    { id: 'com.coinbase.wallet', name: 'Coinbase Wallet', icon: '💎' },
    { id: 'walletconnect', name: 'WalletConnect', icon: '🔗' },
    { id: 'com.phantom', name: 'Phantom', icon: '👻' },
    { id: 'io.rainbow', name: 'Rainbow', icon: '🌈' },
    { id: 'com.trustwallet', name: 'Trust Wallet', icon: '🛡️' },
  ];

  const handleWalletConnect = async (walletId: string) => {
    try {
      setSelectedError(null);
      setConnectingWallet(walletId);
      await connect({ walletId });
      onConnect();
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      setSelectedError(err?.message || 'Failed to connect wallet. Please try again.');
      console.error(err);
    } finally {
      setConnectingWallet(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-3xl max-w-md w-full overflow-hidden">
        <div className="bg-[#E70606] px-6 py-4 flex items-center justify-between">
          <h2 className="font-krona text-xl uppercase">Connect Your Wallet</h2>
          <button
            onClick={onClose}
            disabled={isConnecting}
            className="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-300 font-jost mb-6">
            Choose a wallet to connect to Animazions
          </p>

          {selectedError && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm font-jost">{selectedError}</p>
            </div>
          )}

          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleWalletConnect(wallet.id)}
              disabled={isConnecting}
              className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-[#E70606] rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{wallet.icon}</span>
                <div className="text-left flex-1">
                  <h3 className="font-jost font-bold group-hover:text-[#E70606] transition-colors">
                    {wallet.name}
                  </h3>
                  <p className="text-gray-400 text-sm font-jost">
                    {connectingWallet === wallet.id ? 'Connecting...' : 'Click to connect'}
                  </p>
                </div>
                {connectingWallet === wallet.id && isConnecting && (
                  <Loader className="w-4 h-4 animate-spin text-[#E70606]" />
                )}
              </div>
            </button>
          ))}

          <div className="pt-4 border-t border-gray-700 mt-6">
            <p className="text-xs text-gray-400 text-center font-jost">
              By connecting a wallet, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
