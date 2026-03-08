import { Play, Clock, Star } from 'lucide-react';

const featuredItems = [
  {
    id: 1,
    title: 'Warhammer 40K vs. Leonardo',
    genre: 'Action',
    duration: '8:45',
    rating: 4.9,
    image: 'https://i.postimg.cc/Nj4nGdw0/videoframe-3400.png',
  },
  {
    id: 2,
    title: 'Ocean Dreams',
    genre: 'Fantasy',
    duration: '15:20',
    rating: 4.7,
    image: 'https://static0.moviewebimages.com/wordpress/wp-content/uploads/2023/02/a-scene-from-howls.jpg',
  },
  {
    id: 3,
    title: 'Space Odyssey',
    genre: 'Sci-Fi',
    duration: '22:10',
    rating: 4.8,
    image: 'https://i.postimg.cc/nzRkNW7P/ploop.jpg',
  },
  {
    id: 4,
    title: 'Stranger Things: AI Finale',
    genre: 'Mystery',
    duration: '11:30',
    rating: 4.6,
    image: 'https://i.postimg.cc/Yqq3tM8D/Stranger-things-AI-Finale.jpg',
  },
];

export function FeaturedGrid() {
  return (
    <section className="py-20 px-6 md:px-12 lg:px-24 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-krona text-3xl md:text-4xl lg:text-5xl mb-4">
              TRENDING NOW
            </h2>
            <p className="text-gray-400 font-jost text-lg">
              Discover the hottest animations on the platform
            </p>
          </div>
          <button className="hidden md:block text-[#E70606] hover:text-white font-chakra uppercase text-sm tracking-wider transition-colors">
            View All →
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredItems.map((item) => (
            <div
              key={item.id}
              className="group relative bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-[#E70606] transition-all hover:scale-105 cursor-pointer"
            >
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-16 h-16 bg-[#E70606] rounded-full flex items-center justify-center hover:scale-110 transition-transform border-2 border-white">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-jost text-xl font-bold">{item.title}</h3>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm">{item.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="font-chakra uppercase">{item.genre}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{item.duration}</span>
                  </div>
                </div>
                <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E70606]"
                    style={{ width: `${Math.random() * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="md:hidden mt-8 w-full text-[#E70606] hover:text-white font-chakra uppercase text-sm tracking-wider transition-colors border border-[#E70606] hover:bg-[#E70606] py-3 rounded-lg">
          View All
        </button>
      </div>
    </section>
  );
}
