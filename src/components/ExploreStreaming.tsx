import { ChevronLeft, ChevronRight, Star, Play } from 'lucide-react';
import { useRef } from 'react';

const categories = [
  {
    name: 'New Releases',
    series: [
      { id: 1, title: 'Jujutsu Kaisen Season 2', image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.9 },
      { id: 2, title: 'Demon Slayer Mugen Train', image: 'https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.8 },
      { id: 3, title: 'Attack on Titan Final', image: 'https://images.pexels.com/photos/3782517/pexels-photo-3782517.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.9 },
      { id: 4, title: 'Spy x Family Season 2', image: 'https://images.pexels.com/photos/3783183/pexels-photo-3783183.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.7 },
      { id: 5, title: 'Chainsaw Man', image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.8 },
      { id: 6, title: 'Solo Leveling', image: 'https://images.pexels.com/photos/3632399/pexels-photo-3632399.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.8 },
      { id: 7, title: 'Wind Breaker', image: 'https://images.pexels.com/photos/2821648/pexels-photo-2821648.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.6 },
      { id: 8, title: 'Blue Box', image: 'https://images.pexels.com/photos/1852634/pexels-photo-1852634.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.5 },
    ],
  },
  {
    name: 'Popular Now',
    series: [
      { id: 9, title: 'My Hero Academia', image: 'https://images.pexels.com/photos/1181692/pexels-photo-1181692.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.9 },
      { id: 10, title: 'Naruto Shippuden', image: 'https://images.pexels.com/photos/1181693/pexels-photo-1181693.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.9 },
      { id: 11, title: 'One Piece', image: 'https://images.pexels.com/photos/1181694/pexels-photo-1181694.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.8 },
      { id: 12, title: 'Death Note', image: 'https://images.pexels.com/photos/1181695/pexels-photo-1181695.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.7 },
      { id: 13, title: 'Bleach', image: 'https://images.pexels.com/photos/1181696/pexels-photo-1181696.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.6 },
      { id: 14, title: 'Mob Psycho 100', image: 'https://images.pexels.com/photos/1181697/pexels-photo-1181697.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.8 },
      { id: 15, title: 'Steins;Gate', image: 'https://images.pexels.com/photos/1181698/pexels-photo-1181698.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.9 },
      { id: 16, title: 'Fullmetal Alchemist', image: 'https://images.pexels.com/photos/1181699/pexels-photo-1181699.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.9 },
    ],
  },
  {
    name: 'Trending',
    series: [
      { id: 17, title: 'Frieren: Beyond Journey', image: 'https://images.pexels.com/photos/1181700/pexels-photo-1181700.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.9 },
      { id: 18, title: 'The Apothecary Diaries', image: 'https://images.pexels.com/photos/1181701/pexels-photo-1181701.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.8 },
      { id: 19, title: 'Dungeon Meshi', image: 'https://images.pexels.com/photos/1181702/pexels-photo-1181702.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.7 },
      { id: 20, title: 'Tower of God', image: 'https://images.pexels.com/photos/1181703/pexels-photo-1181703.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.6 },
      { id: 21, title: 'The God of High School', image: 'https://images.pexels.com/photos/1181704/pexels-photo-1181704.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.7 },
      { id: 22, title: 'Lookism', image: 'https://images.pexels.com/photos/1181705/pexels-photo-1181705.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.5 },
      { id: 23, title: 'Omniscient Reader', image: 'https://images.pexels.com/photos/1181706/pexels-photo-1181706.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.8 },
      { id: 24, title: 'Existence', image: 'https://images.pexels.com/photos/1181707/pexels-photo-1181707.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.6 },
    ],
  },
];

function SeriesScroller({ category }: { category: typeof categories[0] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="mb-12">
      <h3 className="font-krona text-2xl md:text-3xl mb-6">{category.name}</h3>
      <div className="relative group">
        <button
          onClick={() => scroll('left')}
          className="absolute -left-16 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <div className="bg-black/60 hover:bg-[#E70606] p-2 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </div>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollBehavior: 'smooth' }}
        >
          {category.series.map((series) => (
            <div
              key={series.id}
              className="flex-shrink-0 w-48 group/card cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-xl border border-gray-700 hover:border-[#E70606] transition-all hover:shadow-lg hover:shadow-[#E70606]/50 h-64">
                <img
                  src={series.image}
                  alt={series.title}
                  className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <button className="w-14 h-14 bg-[#E70606] rounded-full flex items-center justify-center hover:scale-110 transition-transform border-2 border-white">
                    <Play className="w-5 h-5 fill-current ml-1" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                  <h4 className="font-jost font-bold text-sm line-clamp-2">{series.title}</h4>
                  <div className="flex items-center gap-1 text-yellow-400 mt-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs">{series.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute -right-16 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <div className="bg-black/60 hover:bg-[#E70606] p-2 rounded-full transition-colors">
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>
      </div>
    </div>
  );
}

export function ExploreStreaming() {
  return (
    <div className="min-h-screen bg-black text-white pt-24">
      <div
        className="relative h-96 md:h-[500px] w-full bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage:
            'url(https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=1600)',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 lg:px-24">
          <h1 className="font-krona text-4xl md:text-5xl lg:text-6xl mb-4 max-w-2xl">
            Your Next Favorite Anime
          </h1>
          <p className="font-jost text-gray-300 text-lg mb-6 max-w-xl">
            Stream the latest anime series, classics, and exclusive originals all in one place.
          </p>
          <button className="bg-[#E70606] hover:bg-[#c00505] px-8 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-colors w-fit font-bold">
            Start Streaming
          </button>
        </div>
      </div>

      <section className="px-6 md:px-12 lg:px-24 py-16">
        <div className="max-w-[1440px] mx-auto">
          {categories.map((category) => (
            <SeriesScroller key={category.name} category={category} />
          ))}
        </div>
      </section>
    </div>
  );
}
