import { Search, Filter, TrendingUp, Zap } from 'lucide-react';
import { useState, useMemo } from 'react';
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

  const featuredSeries = useMemo(() => {
    return filteredSeries.length > 0 ? filteredSeries[0] : FEATURED_SERIES[0];
  }, [filteredSeries]);

  return (
    <section className="relative">
      <div className="relative h-screen md:h-auto md:aspect-video overflow-hidden bg-black">
        <img
          src={featuredSeries.image}
          alt={featuredSeries.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black"></div>

        <div className="relative h-full flex flex-col justify-center px-6 md:px-12 lg:px-24 py-20 md:py-0">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6">
              The world's largest dedicated Anime collection on demand
            </h1>

            <p className="text-lg md:text-xl text-gray-100 mb-12 leading-relaxed max-w-xl">
              Join us and discover the world of Anime
            </p>

            <button className="inline-flex items-center gap-3 bg-[#FF6B35] hover:bg-[#FF7D4D] text-white font-bold py-4 px-12 rounded-full transition-colors duration-300 text-lg">
              START FREE TRIAL
            </button>
          </div>
        </div>
      </div>

      <div className="relative pt-16 pb-20 px-6 md:px-12 lg:px-24 bg-black">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-12 space-y-8">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search series, creators, genres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35] transition-colors"
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
                        ? 'bg-[#FF6B35] text-white'
                        : 'border border-gray-700 text-gray-300 hover:border-[#FF6B35] hover:text-[#FF6B35]'
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
                <Zap className="w-6 h-6 text-[#FF6B35]" />
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
                <TrendingUp className="w-6 h-6 text-[#FF6B35]" />
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
      </div>
    </section>
  );
}
