import { X } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (wallet: string) => void;
}

const wallets = [
  {
    name: 'MetaMask',
    icon: '🦊',
    description: 'Connect to your MetaMask wallet',
  },
  {
    name: 'Coinbase Wallet',
    icon: '💎',
    description: 'Connect to your Coinbase wallet',
  },
  {
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Scan QR code to connect',
  },
  {
    name: 'Phantom',
    icon: '👻',
    description: 'Connect to your Phantom wallet',
  },
];

export function WalletModal({ isOpen, onClose, onConnect }: WalletModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-3xl max-w-md w-full overflow-hidden">
        <div className="bg-[#E70606] px-6 py-4 flex items-center justify-between">
          <h2 className="font-krona text-xl uppercase">Connect Your Wallet</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-300 font-jost mb-6">
            Choose a wallet to connect to Animazions
          </p>

          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => {
                onConnect(wallet.name);
                onClose();
              }}
              className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-[#E70606] rounded-xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{wallet.icon}</span>
                <div className="text-left flex-1">
                  <h3 className="font-jost font-bold group-hover:text-[#E70606] transition-colors">
                    {wallet.name}
                  </h3>
                  <p className="text-gray-400 text-sm font-jost">{wallet.description}</p>
                </div>
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
