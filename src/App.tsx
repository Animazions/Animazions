import { useState } from 'react';
import { ThirdwebProvider } from '@thirdweb-dev/react';
import { Avalanche } from '@thirdweb-dev/chains';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FeaturedGrid } from './components/FeaturedGrid';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { LaunchEvents } from './components/LaunchEvents';
import { StreamingExplore } from './components/StreamingExplore';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <ThirdwebProvider activeChain={Avalanche}>
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
    </ThirdwebProvider>
  );
}

export default App;
