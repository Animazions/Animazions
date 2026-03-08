import { Play, Star } from 'lucide-react';

interface StreamingCardProps {
  id: string;
  title: string;
  image: string;
  rating: number;
  genre: string;
  episodes?: number;
  status: string;
}

export function StreamingCard({ title, image, rating, genre, episodes, status }: StreamingCardProps) {
  return (
    <div className="group cursor-pointer relative">
      <div className="relative overflow-hidden rounded-lg aspect-[2/3] bg-gray-800 border border-gray-700">
        <img
          src={image}
          alt={title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
          <div className="flex justify-between items-start">
            <span className="bg-[#E70606] px-3 py-1 rounded text-xs font-chakra uppercase font-bold">{status}</span>
            <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded">
              <Star className="w-3 h-3 fill-[#E70606] text-[#E70606]" />
              <span className="text-xs font-chakra">{rating}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <button className="flex-1 bg-[#E70606] hover:bg-[#c00505] px-4 py-2 rounded font-chakra text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                <Play className="w-3 h-3 fill-current" />
                Watch
              </button>
              <button className="flex-1 border border-white hover:bg-white hover:text-black px-4 py-2 rounded font-chakra text-xs uppercase tracking-wider transition-colors">
                Details
              </button>
            </div>
            <div className="space-y-1 text-xs text-gray-200">
              <p className="font-chakra uppercase text-[#E70606]">{genre}</p>
              {episodes && <p className="text-gray-300">{episodes} Episodes</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <h3 className="font-jost font-bold text-sm line-clamp-2 group-hover:text-[#E70606] transition-colors">{title}</h3>
        <p className="text-xs text-gray-400 mt-1">{status}</p>
      </div>
    </div>
  );
}
