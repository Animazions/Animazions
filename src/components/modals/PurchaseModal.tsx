import { useState } from 'react';
import { X, Wallet, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { useAddress, useConnect, metamaskWallet, coinbaseWallet, trustWallet, rainbowWallet, phantomWallet } from '@thirdweb-dev/react';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleSymbol: string;
  tokenPrice: string;
  minBuy: number;
  maxBuy: number;
}

function getMetaMaskProvider(): any {
  if (typeof window === 'undefined') return null;
  const eth = (window as any).ethereum;
  if (!eth) return null;
  if (eth.providers?.length) {
    return eth.providers.find((p: any) => p.isMetaMask && !p.isPhantom && !p.isBraveWallet) ?? null;
  }
  if (eth.isMetaMask && !eth.isPhantom && !eth.isBraveWallet) return eth;
  return null;
}

const walletOptions = [
  { config: metamaskWallet({ shimDisconnect: true }), name: 'MetaMask', icon: '🦊' },
  { config: coinbaseWallet(), name: 'Coinbase Wallet', icon: '💎' },
  { config: trustWallet(), name: 'Trust Wallet', icon: '🛡️' },
  { config: rainbowWallet(), name: 'Rainbow', icon: '🌈' },
  { config: phantomWallet(), name: 'Phantom', icon: '👻' },
];

export function PurchaseModal({ isOpen, onClose, saleSymbol, tokenPrice, minBuy, maxBuy }: PurchaseModalProps) {
  const address = useAddress();
  const connect = useConnect();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'wallet' | 'purchase' | 'confirming' | 'success'>('wallet');
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const usdcTotal = amount ? (parseFloat(amount) * parseFloat(tokenPrice)).toFixed(2) : '0.00';

  const handleConnectWallet = async (name: string, config: any) => {
    try {
      setError(null);
      setConnectingWallet(name);

      if (name === 'MetaMask') {
        const mmProvider = getMetaMaskProvider();
        if (!mmProvider) throw new Error('MetaMask extension not found.');
        const originalEthereum = (window as any).ethereum;
        const needsSwap = originalEthereum !== mmProvider;
        if (needsSwap) {
          Object.defineProperty(window, 'ethereum', { value: mmProvider, writable: true, configurable: true });
        }
        try {
          await mmProvider.request({ method: 'eth_requestAccounts' });
          await connect(config, {});
        } finally {
          if (needsSwap) {
            Object.defineProperty(window, 'ethereum', { value: originalEthereum, writable: true, configurable: true });
          }
        }
      } else {
        await connect(config, {});
      }

      setStep('purchase');
    } catch (err: any) {
      setError(err?.message || 'Failed to connect wallet');
    } finally {
      setConnectingWallet(null);
    }
  };

  const handlePurchase = async () => {
    const qty = parseFloat(amount);
    if (!qty || qty < minBuy || qty > maxBuy) {
      setError(`Amount must be between ${minBuy} and ${maxBuy} ${saleSymbol}`);
      return;
    }
    setError(null);
    setStep('confirming');
    await new Promise((r) => setTimeout(r, 2000));
    setStep('success');
  };

  const handleClose = () => {
    setStep(address ? 'purchase' : 'wallet');
    setAmount('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#E70606] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5" />
            <h2 className="font-krona text-sm uppercase tracking-wider">Purchase Tokens</h2>
          </div>
          <button onClick={handleClose} className="text-white hover:text-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === 'wallet' && (
          <div className="p-6">
            <p className="text-gray-300 font-jost text-sm mb-5">
              Connect a wallet to purchase <span className="text-white font-bold">{saleSymbol}</span> tokens.
            </p>

            {error && (
              <div className="mb-4 bg-red-900/20 border border-red-700 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              {walletOptions.map(({ config, name, icon }) => (
                <button
                  key={name}
                  onClick={() => handleConnectWallet(name, config)}
                  disabled={connectingWallet !== null}
                  className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-[#E70606] rounded-xl transition-all disabled:opacity-50 flex items-center gap-4 group"
                >
                  <span className="text-2xl w-8 text-center">{icon}</span>
                  <span className="font-jost font-bold group-hover:text-[#E70606] transition-colors flex-1 text-left">{name}</span>
                  {connectingWallet === name && <Loader className="w-4 h-4 animate-spin text-[#E70606]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'purchase' && (
          <div className="p-6">
            <div className="bg-gray-800 rounded-xl p-3 mb-5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <p className="text-green-400 text-xs font-chakra uppercase font-bold">Wallet Connected</p>
              <p className="text-gray-400 text-xs ml-auto font-mono">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-900/20 border border-red-700 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-chakra uppercase mb-2 text-gray-300">
                Amount ({saleSymbol})
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min={minBuy}
                max={maxBuy}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#E70606] focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Min: {minBuy} — Max: {maxBuy} {saleSymbol}
              </p>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Token Price</span>
                <span className="text-white">${tokenPrice} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Quantity</span>
                <span className="text-white">{amount || '0'} {saleSymbol}</span>
              </div>
              <div className="border-t border-gray-700 pt-2 flex justify-between text-sm font-bold">
                <span className="text-gray-300">Total</span>
                <span className="text-[#E70606]">${usdcTotal} USDC</span>
              </div>
            </div>

            <button
              onClick={handlePurchase}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full bg-[#E70606] hover:bg-[#c00505] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-chakra uppercase text-sm py-4 rounded-lg transition-all hover:scale-105 font-bold tracking-wider"
            >
              Confirm Purchase
            </button>
          </div>
        )}

        {step === 'confirming' && (
          <div className="p-12 flex flex-col items-center gap-4">
            <Loader className="w-10 h-10 text-[#E70606] animate-spin" />
            <p className="text-gray-400 font-jost">Confirming transaction...</p>
            <p className="text-gray-500 text-xs text-center">Please approve in your wallet if prompted</p>
          </div>
        )}

        {step === 'success' && (
          <div className="p-10 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-green-900/20 border border-green-700 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="font-jost text-xl font-bold">Purchase Successful!</h3>
            <p className="text-gray-400 text-sm text-center">
              You purchased <span className="text-white font-bold">{amount} {saleSymbol}</span> tokens worth <span className="text-[#E70606] font-bold">${usdcTotal} USDC</span>.
            </p>
            <button
              onClick={handleClose}
              className="w-full bg-[#E70606] hover:bg-[#c00505] text-white font-chakra uppercase text-sm py-4 rounded-lg transition-all mt-2"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
