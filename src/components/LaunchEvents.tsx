import { TrendingUp, Users, Clock, Target } from 'lucide-react';
import { salesData } from '../data/salesData';

interface LaunchEventsProps {
  onNavigate?: (page: string, saleId?: number) => void;
}

export function LaunchEvents({ onNavigate }: LaunchEventsProps) {
  const handleJoinSale = (saleId: number) => {
    if (onNavigate) {
      onNavigate('sale', saleId);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24">
      <section className="py-12 px-6 md:px-12 lg:px-24">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-12">
            <h1 className="font-krona text-4xl md:text-5xl lg:text-6xl mb-4">
              Launch <span className="text-[#E70606]">Events</span>
            </h1>
            <p className="text-gray-400 font-jost text-lg max-w-2xl">
              Explore the hottest token launches and participate in active sales. Discover innovative projects backed by the community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {salesData.map((sale) => (
              <div
                key={sale.id}
                className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700 hover:border-[#E70606] transition-all hover:shadow-xl hover:shadow-[#E70606]/20"
              >
                <div className="relative">
                  <img
                    src={sale.image}
                    alt={sale.name}
                    className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900"></div>
                  <div className="absolute top-3 right-3">
                    <span className="bg-[#E70606] text-white text-xs font-chakra uppercase px-3 py-1 rounded-full">
                      {sale.status}
                    </span>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="bg-black/60 text-white text-xs font-chakra uppercase px-3 py-1 rounded-full">
                      {sale.category}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-jost text-xl font-bold mb-1">{sale.name}</h3>
                      <p className="text-gray-400 font-chakra text-sm">${sale.symbol}</p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-[#E70606]" />
                  </div>

                  <div className="space-y-3 mb-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress</span>
                        <span className="font-chakra text-white font-bold">{sale.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#E70606] to-red-400"
                          style={{ width: `${sale.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-800 rounded-lg p-2">
                        <p className="text-gray-400 text-xs mb-1">Raised</p>
                        <p className="font-chakra font-bold">${sale.raised}</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-2">
                        <p className="text-gray-400 text-xs mb-1">Goal</p>
                        <p className="font-chakra font-bold">${sale.goal}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-gray-700 pt-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-[#E70606]" />
                      <span className="text-gray-300">{sale.participants.toLocaleString()} participants</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-[#E70606]" />
                      <span className="text-gray-300">Ends in {sale.endDate}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoinSale(sale.id)}
                    className="w-full bg-[#E70606] hover:bg-[#c00505] text-white font-chakra uppercase text-sm py-3 rounded-lg transition-colors font-bold tracking-wider"
                  >
                    Join Sale
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
