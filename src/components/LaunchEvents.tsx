import { TrendingUp, Users, Clock, Target } from 'lucide-react';

interface LaunchEventsProps {
  onNavigate?: (page: string, saleId?: number) => void;
}

const sales = [
  {
    id: 1,
    name: 'Nebula Protocol',
    symbol: 'NBL',
    image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=200',
    progress: 75,
    raised: '125,000',
    goal: '200,000',
    participants: 3420,
    status: 'Active',
    endDate: '2 days',
    category: 'DeFi',
  },
  {
    id: 2,
    name: 'Stellar AI',
    symbol: 'STL',
    image: 'https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=200',
    progress: 92,
    raised: '180,000',
    goal: '200,000',
    participants: 5610,
    status: 'Active',
    endDate: '1 day',
    category: 'AI',
  },
  {
    id: 3,
    name: 'Quantum Vault',
    symbol: 'QVT',
    image: 'https://images.pexels.com/photos/3782517/pexels-photo-3782517.jpeg?auto=compress&cs=tinysrgb&w=200',
    progress: 45,
    raised: '85,500',
    goal: '200,000',
    participants: 1850,
    status: 'Active',
    endDate: '5 days',
    category: 'Security',
  },
  {
    id: 4,
    name: 'Pixel Studios',
    symbol: 'PIX',
    image: 'https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg?auto=compress&cs=tinysrgb&w=200',
    progress: 60,
    raised: '120,000',
    goal: '200,000',
    participants: 2940,
    status: 'Active',
    endDate: '3 days',
    category: 'Gaming',
  },
  {
    id: 5,
    name: 'Crypto Lens',
    symbol: 'CLN',
    image: 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=200',
    progress: 88,
    raised: '175,000',
    goal: '200,000',
    participants: 4720,
    status: 'Active',
    endDate: '6 hours',
    category: 'Analytics',
  },
  {
    id: 6,
    name: 'MetaVerse X',
    symbol: 'MVX',
    image: 'https://images.pexels.com/photos/3844787/pexels-photo-3844787.jpeg?auto=compress&cs=tinysrgb&w=200',
    progress: 35,
    raised: '70,000',
    goal: '200,000',
    participants: 1230,
    status: 'Active',
    endDate: '4 days',
    category: 'Metaverse',
  },
];

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
              Launch Events
            </h1>
            <p className="text-gray-400 font-jost text-lg max-w-2xl">
              Explore the hottest token launches and participate in active sales. Discover innovative projects backed by the community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sales.map((sale) => (
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
