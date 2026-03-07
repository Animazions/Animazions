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
import { Avalanche } from '@thirdweb-dev/chains';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FeaturedGrid } from './components/FeaturedGrid';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { LaunchEvents } from './components/LaunchEvents';
import { StreamingExplore } from './components/StreamingExplore';

const supportedWallets = [
  metamaskWallet(),
  coinbaseWallet(),
  walletConnect(),
  trustWallet(),
  rainbowWallet(),
  phantomWallet(),
];

function AppInner() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <div className="min-h-screen bg-black text-white">
      <Header onNavigate={setCurrentPage} />
      {currentPage === 'home' ? (
        <>
          <Hero onNavigate={setCurrentPage} />
          <FeaturedGrid />
          <Features />
        </>
      ) : currentPage === 'launch' ? (
        <LaunchEvents />
      ) : currentPage === 'streaming' ? (
        <StreamingExplore />
      ) : null}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThirdwebProvider activeChain={Avalanche} supportedWallets={supportedWallets}>
      <AppInner />
    </ThirdwebProvider>
  );
}

export default App;
