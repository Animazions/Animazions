import { Menu } from 'lucide-react';
import { useState } from 'react';
import { WalletModal } from './WalletModal';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-[#E70606] rounded">
              <span className="font-bold text-white text-lg">A</span>
            </div>
            <span className="font-krona text-xl md:text-2xl text-white">ANIMAZIONS</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors">
              Create AI Animation
            </a>
            <a href="#" className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors">
              Launch Events
            </a>
            <a href="#" className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors">
              Explore
            </a>
            <a href="#" className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors">
              About
            </a>
            <button
              onClick={() => setWalletModalOpen(true)}
              className="bg-[#E70606] hover:bg-[#c00505] px-6 py-2 rounded-lg font-chakra text-sm uppercase tracking-wider transition-colors"
            >
              {connectedWallet ? `${connectedWallet.slice(0, 6)}...` : 'Connect Wallet'}
            </button>
          </nav>

          <button
            className="md:hidden text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {menuOpen && (
          <nav className="md:hidden flex flex-col gap-4 mt-6 pb-4">
            <a href="#" className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors">
              Create AI Animation
            </a>
            <a href="#" className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors">
              Launch Events
            </a>
            <a href="#" className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors">
              Explore
            </a>
            <a href="#" className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors">
              About
            </a>
            <button
              onClick={() => {
                setWalletModalOpen(true);
                setMenuOpen(false);
              }}
              className="bg-[#E70606] hover:bg-[#c00505] px-6 py-2 rounded-lg font-chakra text-sm uppercase tracking-wider transition-colors w-full"
            >
              {connectedWallet ? `${connectedWallet.slice(0, 6)}...` : 'Connect Wallet'}
            </button>
          </nav>
        )}

        <WalletModal
          isOpen={walletModalOpen}
          onClose={() => setWalletModalOpen(false)}
          onConnect={(wallet) => setConnectedWallet(wallet)}
        />
      </div>
    </header>
  );
}
