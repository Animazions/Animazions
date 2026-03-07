import { Search, Filter, TrendingUp, Zap } from 'lucide-react';
import { useState } from 'react';
import { StreamingCard } from './StreamingCard';

const FEATURED_SERIES = [
  {
    id: '1',
    title: 'Echoes of Tomorrow',
    image: 'https://images.pexels.com/photos/1440404/pexels-photo-1440404.jpeg?auto=compress&cs=tinysrgb&w=600',
    rating: 9.2,
    genre: 'Sci-Fi',
    episodes: 24,
    status: 'NEW',
  },
  {
    id: '2',
    title: 'Neon City Chronicles',
    image: 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=600',
    rating: 8.9,
    genre: 'Action',
    episodes: 12,
    status: 'ONGOING',
  },
  {
    id: '3',
    title: 'Dreams & Reality',
    image: 'https://images.pexels.com/photos/3950375/pexels-photo-3950375.jpeg?auto=compress&cs=tinysrgb&w=600',
    rating: 8.7,
    genre: 'Drama',
    episodes: 26,
    status: 'COMPLETED',
  },
  {
    id: '4',
    title: 'Stellar Guardians',
    image: 'https://images.pexels.com/photos/1476514/pexels-photo-1476514.jpeg?auto=compress&cs=tinysrgb&w=600',
    rating: 9.1,
    genre: 'Adventure',
    episodes: 13,
    status: 'NEW',
  },
  {
    id: '5',
    title: 'Midnight Mysteries',
    image: 'https://images.pexels.com/photos/1954496/pexels-photo-1954496.jpeg?auto=compress&cs=tinysrgb&w=600',
    rating: 8.4,
    genre: 'Mystery',
    episodes: 10,
    status: 'ONGOING',
  },
  {
    id: '6',
    title: 'Beyond the Veil',
    image: 'https://images.pexels.com/photos/2869499/pexels-photo-2869499.jpeg?auto=compress&cs=tinysrgb&w=600',
    rating: 8.8,
    genre: 'Fantasy',
    episodes: 16,
    status: 'UPCOMING',
  },
];

const CATEGORIES = ['All', 'Action', 'Drama', 'Comedy', 'Sci-Fi', 'Fantasy', 'Adventure', 'Mystery'];

export function StreamingExplore() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSeries = FEATURED_SERIES.filter((series) => {
    const matchesCategory = selectedCategory === 'All' || series.genre === selectedCategory;
    const matchesSearch = series.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="pt-32 pb-20 px-6 md:px-12 lg:px-24">
      <div className="max-w-[1440px] mx-auto">
        <div className="mb-12 space-y-8">
          <div>
            <h1 className="font-krona text-4xl md:text-5xl lg:text-6xl leading-tight mb-4">
              EXPLORE
              <span className="block text-[#E70606]">STREAMING</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl font-jost max-w-2xl">
              Discover thousands of premium animated series and connect with creators on the blockchain.
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search series, creators, genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#E70606] transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-chakra text-sm uppercase tracking-wider whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-[#E70606] text-white'
                      : 'border border-gray-700 text-gray-300 hover:border-[#E70606] hover:text-[#E70606]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-16">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-[#E70606]" />
              <h2 className="font-krona text-2xl md:text-3xl">Trending Now</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredSeries.slice(0, 4).map((series) => (
                <StreamingCard key={series.id} {...series} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-[#E70606]" />
              <h2 className="font-krona text-2xl md:text-3xl">All Series</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredSeries.map((series) => (
                <StreamingCard key={series.id} {...series} />
              ))}
            </div>
          </div>

          {filteredSeries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg font-jost">No series found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
