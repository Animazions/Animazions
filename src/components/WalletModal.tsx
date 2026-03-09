import { X, Loader, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import {
  useConnect,
  metamaskWallet,
  coinbaseWallet,
  trustWallet,
  rainbowWallet,
  phantomWallet,
} from '@thirdweb-dev/react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

const isMetaMaskInstalled = typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask);

const walletConfigs = [
  {
    config: metamaskWallet(),
    name: 'MetaMask',
    description: isMetaMaskInstalled ? 'Browser extension & mobile' : 'Extension not detected — install first',
    icon: '🦊',
    disabled: !isMetaMaskInstalled,
    installUrl: 'https://metamask.io/download/',
  },
  { config: coinbaseWallet(), name: 'Coinbase Wallet', description: 'Connect with Coinbase', icon: '💎', disabled: false },
  { config: trustWallet(), name: 'Trust Wallet', description: 'Mobile crypto wallet', icon: '🛡️', disabled: false },
  { config: rainbowWallet(), name: 'Rainbow', description: 'A fun, simple wallet', icon: '🌈', disabled: false },
  { config: phantomWallet(), name: 'Phantom', description: 'Solana & EVM wallet', icon: '👻', disabled: false },
];

export function WalletModal({ isOpen, onClose, onConnect }: WalletModalProps) {
  const connect = useConnect();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleConnect = async (walletName: string, config: any) => {
    try {
      setError(null);
      setConnectingId(walletName);
      await connect(config, {});
      onConnect();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to connect. Please try again.');
    } finally {
      setConnectingId(null);
    }
  };

  const isConnecting = connectingId !== null;

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

        <div className="p-6 space-y-3">
          <p className="text-gray-300 font-jost mb-4">
            Choose a wallet to connect to Animazions
          </p>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm font-jost">{error}</p>
            </div>
          )}

          {walletConfigs.map(({ config, name, description, icon, disabled, installUrl }) => (
            disabled && installUrl ? (
              <a
                key={name}
                href={installUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-4 bg-gray-800/30 border border-gray-700 border-dashed rounded-xl transition-all group flex items-center gap-4"
              >
                <span className="text-2xl w-10 text-center opacity-50">{icon}</span>
                <div className="text-left flex-1">
                  <h3 className="font-jost font-bold text-gray-500">{name}</h3>
                  <p className="text-gray-500 text-sm font-jost">{description}</p>
                </div>
                <span className="text-xs text-[#E70606] font-jost font-semibold shrink-0">Install</span>
              </a>
            ) : (
              <button
                key={name}
                onClick={() => handleConnect(name, config)}
                disabled={isConnecting || disabled}
                className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-[#E70606] rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl w-10 text-center">{icon}</span>
                  <div className="text-left flex-1">
                    <h3 className="font-jost font-bold group-hover:text-[#E70606] transition-colors">
                      {name}
                    </h3>
                    <p className="text-gray-400 text-sm font-jost">
                      {connectingId === name ? 'Connecting...' : description}
                    </p>
                  </div>
                  {connectingId === name && (
                    <Loader className="w-4 h-4 animate-spin text-[#E70606] shrink-0" />
                  )}
                </div>
              </button>
            )
          ))}

          <div className="pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center font-jost">
              By connecting a wallet, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
