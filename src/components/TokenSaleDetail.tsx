import { Clock, Users, Target, Shield, Zap, Heart } from 'lucide-react';
import { useState, useMemo } from 'react';
import { getSaleById } from '../data/salesData';

interface TokenSaleDetailProps {
  saleId?: number;
  onNavigate?: (page: string) => void;
}

export function TokenSaleDetail({ saleId = 1 }: TokenSaleDetailProps) {
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [liked, setLiked] = useState(false);

  const sale = useMemo(() => {
    return (getSaleById(saleId) ?? getSaleById(1))!;
  }, [saleId]);

  const handleBuy = () => {
    if (amount && parseFloat(amount) > 0) {
      console.log(`Purchasing ${amount} ${sale.symbol} tokens`);
    }
  };

  const roadmap = useMemo(() => {
    if (saleId === 2) {
      return [
        { phase: 'Phase 1', title: 'Produce Movie', status: 'Planned', date: 'Q1 2026' },
        { phase: 'Phase 2', title: 'Release Movie', status: 'Planned', date: 'Q1/Q2 2026' },
        { phase: 'Phase 3', title: 'Release merchandizing and NFT collection', status: 'Planned', date: 'Q2 2026' },
        { phase: 'Phase 4', title: 'Produce the second movie', status: 'Planned', date: 'Q3/Q4 2026' },
      ];
    }
    return [
      { phase: 'Phase 1', title: 'Produce Series one', status: 'Planned', date: 'Q1 2026' },
      { phase: 'Phase 2', title: 'Release Series one', status: 'Planned', date: 'Q1/Q2 2026' },
      { phase: 'Phase 3', title: 'Produce Series 2 and release merchandizing', status: 'Planned', date: 'Q2 2026' },
      { phase: 'Phase 4', title: 'Release Series 2 and start production on the first movie', status: 'Planned', date: 'Q3/Q4 2026' },
    ];
  }, [saleId]);

  const team = [
    { name: 'Alex Chen', role: 'Founder & CEO', image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { name: 'Jordan Lee', role: 'CTO', image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { name: 'Maria Garcia', role: 'Lead Developer', image: 'https://images.pexels.com/photos/1987301/pexels-photo-1987301.jpeg?auto=compress&cs=tinysrgb&w=200' },
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-24">
      <section className="px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid lg:grid-cols-3 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="relative rounded-2xl overflow-hidden mb-8 border border-gray-700">
                <img
                  src={sale.image}
                  alt={sale.name}
                  className="w-full h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <h1 className="font-krona text-4xl md:text-5xl mb-4">{sale.name}</h1>
                  <div className="flex items-center gap-4">
                    <span className="bg-[#E70606] text-white text-xs font-chakra uppercase px-3 py-1 rounded-full">
                      {sale.status}
                    </span>
                    <span className="bg-gray-800 text-white text-xs font-chakra uppercase px-3 py-1 rounded-full">
                      {sale.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <p className="text-gray-400 text-sm mb-2 font-chakra uppercase">Token Price</p>
                  <p className="text-2xl font-bold text-[#E70606]">${sale.tokenPrice}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <p className="text-gray-400 text-sm mb-2 font-chakra uppercase">Min/Max Buy</p>
                  <p className="text-2xl font-bold">{sale.minBuy} - {sale.maxBuy} {sale.symbol}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <p className="text-gray-400 text-sm mb-2 font-chakra uppercase">Time Left</p>
                  <p className="text-2xl font-bold text-[#E70606]">{sale.endDate}</p>
                </div>
              </div>

              <div className="border-b border-gray-700 mb-8">
                <div className="flex gap-6 mb-0">
                  {['details', 'roadmap', 'team'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-2 font-chakra uppercase text-sm tracking-wider border-b-2 transition-colors ${
                        activeTab === tab
                          ? 'border-[#E70606] text-white'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'details' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="font-jost text-2xl font-bold mb-4">About {sale.name}</h3>
                    <p className="text-gray-300 leading-relaxed mb-4">{sale.longDescription}</p>
                    <p className="text-gray-400">{sale.description}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-jost text-lg font-bold mb-4">Tokenomics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Total Supply</span>
                          <span className="font-bold">{sale.totalSupply}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Burn Rate</span>
                          <span className="font-bold text-[#E70606]">{sale.burnRate}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Liquidity Lock</span>
                          <span className="font-bold">{sale.liquidityLock}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-jost text-lg font-bold mb-4">Key Features</h4>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-[#E70606] flex-shrink-0" />
                          <span>Smart Contract Audited</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-[#E70606] flex-shrink-0" />
                          <span>Lightning-fast Transactions</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-[#E70606] flex-shrink-0" />
                          <span>Community Governed</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'roadmap' && (
                <div>
                  <h3 className="font-jost text-2xl font-bold mb-8">Project Roadmap</h3>
                  <div className="space-y-4">
                    {roadmap.map((item, index) => (
                      <div key={index} className="flex gap-6 items-start">
                        <div className="min-w-fit">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                            item.status === 'Completed' ? 'bg-[#E70606] text-white' :
                            item.status === 'In Progress' ? 'bg-yellow-500 text-black' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          {index < roadmap.length - 1 && (
                            <div className="w-1 h-12 bg-gray-700 mx-auto mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-jost text-lg font-bold">{item.phase}</h4>
                            <span className={`text-xs font-chakra uppercase px-3 py-1 rounded-full ${
                              item.status === 'Completed' ? 'bg-[#E70606] text-white' :
                              item.status === 'In Progress' ? 'bg-yellow-500 text-black' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-gray-400 mb-2">{item.title}</p>
                          <p className="text-gray-500 text-sm">{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div>
                  <h3 className="font-jost text-2xl font-bold mb-8">Meet the Team</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {team.map((member, index) => (
                      <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center group hover:border-[#E70606] transition-all">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-48 object-cover rounded-lg mb-4 group-hover:scale-105 transition-transform"
                        />
                        <h4 className="font-jost text-lg font-bold mb-1">{member.name}</h4>
                        <p className="text-[#E70606] font-chakra text-sm uppercase">{member.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 sticky top-32">
                <div className="mb-8">
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-bold">{sale.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#E70606] to-red-400"
                        style={{ width: `${sale.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-900 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Raised</p>
                      <p className="font-chakra font-bold">${(sale.raised / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Goal</p>
                      <p className="font-chakra font-bold">${(sale.goal / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-y border-gray-700 py-6 mb-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-[#E70606] flex-shrink-0" />
                    <span className="text-sm text-gray-300">{sale.participants.toLocaleString()} Participants</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#E70606] flex-shrink-0" />
                    <span className="text-sm text-gray-300">Ends in {sale.endDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-[#E70606] flex-shrink-0" />
                    <span className="text-sm text-gray-300">$ {sale.tokenPrice} per token</span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-chakra uppercase mb-3 text-gray-300">Amount ({sale.symbol})</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#E70606] focus:outline-none"
                  />
                  {amount && (
                    <p className="text-xs text-gray-400 mt-2">
                      ≈ ${(parseFloat(amount) * parseFloat(sale.tokenPrice)).toFixed(2)} USDC
                    </p>
                  )}
                </div>

                <button
                  onClick={handleBuy}
                  className="w-full bg-[#E70606] hover:bg-[#c00505] text-white font-chakra uppercase text-sm py-4 rounded-lg transition-all hover:scale-105 font-bold tracking-wider mb-3"
                >
                  Join Sale
                </button>

                <button
                  onClick={() => setLiked(!liked)}
                  className={`w-full border rounded-lg py-3 font-chakra uppercase text-sm tracking-wider transition-all flex items-center justify-center gap-2 ${
                    liked
                      ? 'bg-[#E70606]/10 border-[#E70606] text-[#E70606]'
                      : 'border-gray-700 text-gray-300 hover:border-[#E70606]'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                  {liked ? 'Liked' : 'Like Project'}
                </button>

                <div className="mt-8 pt-6 border-t border-gray-700">
                  <h4 className="font-jost font-bold mb-4">Connect</h4>
                  <div className="flex gap-3">
                    <a href={sale.socials.twitter} className="flex-1 bg-gray-900 hover:bg-[#E70606] text-center py-2 rounded-lg transition-colors text-sm font-chakra uppercase">
                      Twitter
                    </a>
                    <a href={sale.socials.discord} className="flex-1 bg-gray-900 hover:bg-[#E70606] text-center py-2 rounded-lg transition-colors text-sm font-chakra uppercase">
                      Discord
                    </a>
                    <a href={sale.socials.telegram} className="flex-1 bg-gray-900 hover:bg-[#E70606] text-center py-2 rounded-lg transition-colors text-sm font-chakra uppercase">
                      TG
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
