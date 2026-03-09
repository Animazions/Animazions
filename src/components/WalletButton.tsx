import { useState } from 'react';
import { ChevronDown, LogOut, Copy, Check } from 'lucide-react';
import { useAddress, useDisconnect } from '@thirdweb-dev/react';
import { useAvaxBalance } from '../hooks/useAvaxBalance';
import { WalletModal } from './WalletModal';

export function WalletButton() {
  const address = useAddress();
  const disconnect = useDisconnect();
  const { balance, loading } = useAvaxBalance();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
  };

  if (!address) {
    return (
      <>
        <button
          onClick={() => setShowWalletModal(true)}
          className="bg-[#E70606] hover:bg-[#c00505] px-6 py-2 rounded-lg font-chakra text-sm uppercase tracking-wider transition-colors"
        >
          Connect Wallet
        </button>
        <WalletModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onConnect={() => setShowWalletModal(false)}
        />
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-[#E70606] px-4 py-2 rounded-lg transition-all"
      >
        <div className="w-2 h-2 rounded-full bg-green-400 shrink-0"></div>
        <div className="flex flex-col items-start">
          <span className="font-chakra text-xs text-white uppercase tracking-wider">
            {shortAddress}
          </span>
          <span className="font-chakra text-xs text-gray-400">
            {loading ? (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 border border-gray-400 border-t-transparent rounded-full animate-spin inline-block"></span>
              </span>
            ) : balance !== null ? (
              `${balance.toFixed(4)} AVAX`
            ) : (
              '— AVAX'
            )}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700">
              <p className="text-xs text-gray-400 font-chakra uppercase tracking-wider mb-1">Connected</p>
              <p className="text-sm text-white font-chakra">{shortAddress}</p>
              <p className="text-sm text-[#E70606] font-chakra mt-0.5">
                {loading ? '...' : balance !== null ? `${balance.toFixed(4)} AVAX` : '— AVAX'}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
              <span className="font-chakra text-sm text-gray-300">
                {copied ? 'Copied!' : 'Copy Address'}
              </span>
            </button>
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left border-t border-gray-700"
            >
              <LogOut className="w-4 h-4 text-[#E70606]" />
              <span className="font-chakra text-sm text-[#E70606]">Disconnect</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
