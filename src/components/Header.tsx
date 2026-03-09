import { Menu, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { ConnectWallet, useAddress } from '@thirdweb-dev/react';
import { useAuth } from '../contexts/AuthContext';
import { useAvaxBalance } from '../hooks/useAvaxBalance';

function ConnectedButton() {
  const address = useAddress();
  const { balance, loading } = useAvaxBalance();

  if (!address) return null;

  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div
      style={{
        background: '#E70606',
        padding: '8px 20px',
        borderRadius: '8px',
        fontFamily: 'var(--font-chakra)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        lineHeight: 1.3,
      }}
    >
      <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff' }}>
        {short}
      </span>
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
        {loading ? '...' : balance !== null ? `${balance} AVAX` : '0 AVAX'}
      </span>
    </div>
  );
}

const connectWalletStyle: React.CSSProperties = {
  background: '#E70606',
  padding: '8px 24px',
  borderRadius: '8px',
  fontFamily: 'var(--font-chakra)',
  fontSize: '14px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  minWidth: 'unset',
  height: 'auto',
};

interface HeaderProps {
  onNavigate?: (page: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

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
            <button onClick={() => handleNavigate('create')} className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors cursor-pointer">
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
            {user && (
              <button
                onClick={() => handleNavigate('projects')}
                className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors cursor-pointer flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                My Projects
              </button>
            )}
            <ConnectWallet
              theme="dark"
              btnTitle="Connect Wallet"
              modalTitle="Connect Your Wallet"
              switchToActiveChain={false}
              showThirdwebBranding={false}
              detailsBtn={() => <ConnectedButton />}
              style={connectWalletStyle}
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
            <button onClick={() => handleNavigate('create')} className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors cursor-pointer text-left">
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
            {user && (
              <button
                onClick={() => handleNavigate('projects')}
                className="font-chakra text-sm uppercase tracking-wider hover:text-[#E70606] transition-colors cursor-pointer text-left flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                My Projects
              </button>
            )}
            <ConnectWallet
              theme="dark"
              btnTitle="Connect Wallet"
              modalTitle="Connect Your Wallet"
              switchToActiveChain={false}
              showThirdwebBranding={false}
              detailsBtn={() => <ConnectedButton />}
            />
          </nav>
        )}
      </div>
    </header>
  );
}
