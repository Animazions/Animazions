import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

const queryClient = new QueryClient();

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

  const handleNavigate = (page: string, saleId?: number) => {
    setCurrentPage(page);
    if (saleId) {
      setSelectedSaleId(saleId);
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
        <AIAnimation onNavigate={handleNavigate} />
      ) : null}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThirdwebProvider supportedChains={supportedChains} supportedWallets={supportedWallets}>
        <AppInner />
      </ThirdwebProvider>
    </QueryClientProvider>
  );
}

export default App;
