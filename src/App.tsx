import { useState } from 'react';
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
    <div className="min-h-screen bg-black text-white">
      <Header onNavigate={setCurrentPage} />
      {currentPage === 'home' ? (
        <>
          <Hero />
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

export default App;
