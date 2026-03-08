import { Menu } from 'lucide-react';
import { useState } from 'react';
import { ConnectWallet } from '@thirdweb-dev/react';

interface HeaderProps {
  onNavigate?: (page: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigate = (page: string) => {
    if (onNavigate) onNavigate(page);
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigate('home')}>
            <img src="https://animazions.com/wp-content/uploads/2025/10/asdasda-01-01-1.png" alt="Animazions Logo" className="h-13 md:h-16" />
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => handleNavigate('home')} className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors cursor-pointer">
              Create AI Animation
            </button>
            <button onClick={() => handleNavigate('launch')} className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors cursor-pointer">
              Launch Events
            </button>
            <button onClick={() => handleNavigate('streaming')} className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors cursor-pointer">
              Explore Streaming
            </button>
            <button onClick={() => handleNavigate('home')} className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors cursor-pointer">
              Home
            </button>
            <ConnectWallet
              theme="dark"
              btnTitle="Connect Wallet"
              modalTitle="Connect Your Wallet"
              switchToActiveChain={false}
              showThirdwebBranding={false}
              className="!bg-[#E70606] hover:!bg-[#c00505] !px-6 !py-2 !rounded-lg !font-chakra !text-sm !uppercase !tracking-wider !transition-colors"
            />
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
            <button onClick={() => handleNavigate('home')} className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors cursor-pointer text-left">
              Create AI Animation
            </button>
            <button onClick={() => handleNavigate('launch')} className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors cursor-pointer text-left">
              Launch Events
            </button>
            <button onClick={() => handleNavigate('streaming')} className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors cursor-pointer text-left">
              Explore Streaming
            </button>
            <button onClick={() => handleNavigate('home')} className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors cursor-pointer text-left">
              Home
            </button>
            <ConnectWallet
              theme="dark"
              btnTitle="Connect Wallet"
              modalTitle="Connect Your Wallet"
              switchToActiveChain={false}
              showThirdwebBranding={false}
            />
          </nav>
        )}
      </div>
    </header>
  );
}
