import { ThirdwebProvider } from '@thirdweb-dev/react';
import { Ethereum } from '@thirdweb-dev/chains';
import { Play, Film, Sparkles, Shield, Coins, Users, TrendingUp, Globe } from 'lucide-react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FeaturedGrid } from './components/FeaturedGrid';
import { Features } from './components/Features';
import { Footer } from './components/Footer';

function App() {
  return (
    <ThirdwebProvider activeChain={Ethereum}>
      <div className="min-h-screen bg-black text-white">
        <Header />
        <Hero />
        <FeaturedGrid />
        <Features />
        <Footer />
      </div>
    </ThirdwebProvider>
  );
}

export default App;
