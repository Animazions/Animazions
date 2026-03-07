import { Menu } from 'lucide-react';
import { useState, lazy, Suspense } from 'react';

const ConnectWallet = lazy(() => import('@thirdweb-dev/react').then(m => ({ default: m.ConnectWallet })));

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://animazions.com/wp-content/uploads/2025/10/asdasda-01-01-1.png" alt="Animazions Logo" className="h-13 md:h-16" />
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors">
              Create AI Animation
            </a>
            <a href="#" className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors">
              Launch Events
            </a>
            <a href="#" className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors">
              Explore Streaming
            </a>
            <a href="#" className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors">
              About
            </a>
            <Suspense fallback={<button className="bg-[#E70606] hover:bg-[#c00505] px-6 py-2 rounded-lg font-chakra text-sm uppercase tracking-wider transition-colors">Connect Wallet</button>}>
              <ConnectWallet
                btnTitle="Connect Wallet"
                theme="dark"
                modalTitle="Connect Your Wallet"
              />
            </Suspense>
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
              Explore Streaming
            </a>
            <a href="#" className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors">
              About
            </a>
            <div onClick={() => setMenuOpen(false)}>
              <Suspense fallback={<button className="bg-[#E70606] hover:bg-[#c00505] px-6 py-2 rounded-lg font-chakra text-sm uppercase tracking-wider transition-colors w-full">Connect Wallet</button>}>
                <ConnectWallet
                  btnTitle="Connect Wallet"
                  theme="dark"
                  modalTitle="Connect Your Wallet"
                />
              </Suspense>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
