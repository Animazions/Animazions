import { useState } from 'react';
import {
  ThirdwebProvider,
  metamaskWallet,
  coinbaseWallet,
  walletConnect,
  trustWallet,
  rainbowWallet,
  phantomWallet,
} from '@thirdweb-dev/react';
import { Avalanche, Ethereum, Polygon, Arbitrum, Optimism } from '@thirdweb-dev/chains';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FeaturedGrid } from './components/FeaturedGrid';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { LaunchEvents } from './components/LaunchEvents';
import { StreamingExplore } from './components/StreamingExplore';
import { TokenSaleDetail } from './components/TokenSaleDetail';
import { AIAnimation } from './components/AIAnimation';
import { MyProjects } from './components/MyProjects';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const supportedWallets = [
  metamaskWallet(),
  coinbaseWallet(),
  walletConnect(),
  trustWallet(),
  rainbowWallet(),
  phantomWallet(),
];

const supportedChains = [
  Avalanche,
  Ethereum,
  Polygon,
  Arbitrum,
  Optimism,
];

function AppInner() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedSaleId, setSelectedSaleId] = useState<number | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  const handleNavigate = (page: string, id?: number | string) => {
    setCurrentPage(page);
    if (page === 'sale' && typeof id === 'number') {
      setSelectedSaleId(id);
    } else if (page === 'create' && typeof id === 'string') {
      setSelectedProjectId(id);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header onNavigate={handleNavigate} />
      {currentPage === 'home' ? (
        <>
          <Hero onNavigate={handleNavigate} />
          <FeaturedGrid />
          <Features />
        </>
      ) : currentPage === 'launch' ? (
        <LaunchEvents onNavigate={handleNavigate} />
      ) : currentPage === 'streaming' ? (
        <StreamingExplore />
      ) : currentPage === 'sale' ? (
        <TokenSaleDetail saleId={selectedSaleId} onNavigate={handleNavigate} />
      ) : currentPage === 'create' ? (
        <AIAnimation onNavigate={handleNavigate} projectId={selectedProjectId} />
      ) : currentPage === 'projects' ? (
        <MyProjects onNavigate={handleNavigate} />
      ) : null}
      <Footer />
    </div>
  );
}

const THIRDWEB_CLIENT_ID = import.meta.env.VITE_THIRDWEB_CLIENT_ID ?? 'placeholder-client-id';
const DAPP_META = {
  name: 'Animazions',
  description: 'AI Animation Platform',
  logoUrl: 'https://animazions.com/wp-content/uploads/2025/10/asdasda-01-01-1.png',
  url: typeof window !== 'undefined' ? window.location.origin : '',
};

function App() {
  return (
    <ErrorBoundary>
      <ThirdwebProvider
        clientId={THIRDWEB_CLIENT_ID}
        supportedChains={supportedChains}
        supportedWallets={supportedWallets}
        dAppMeta={DAPP_META}
      >
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </ThirdwebProvider>
    </ErrorBoundary>
  );
}

export default App;
