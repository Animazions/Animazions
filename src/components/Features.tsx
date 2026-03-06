import { Sparkles, Shield, Coins, Users, Globe, Zap } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'Premium Content',
    description: 'Access exclusive animations from top creators worldwide',
  },
  {
    icon: Shield,
    title: 'Blockchain Security',
    description: 'Your assets protected with cutting-edge Web 3.0 technology',
  },
  {
    icon: Coins,
    title: 'Create AI Animation',
    description: 'Buy, sell, and trade animation NFTs seamlessly',
  },
  {
    icon: Users,
    title: 'Creator Community',
    description: 'Connect with artists and fellow animation enthusiasts',
  },
  {
    icon: Globe,
    title: 'Global Platform',
    description: 'Stream from anywhere with our decentralized network',
  },
  {
    icon: Zap,
    title: 'Instant Streaming',
    description: 'Lightning-fast playback with zero buffering',
  },
];

export function Features() {
  return (
    <section className="py-20 px-6 md:px-12 lg:px-24 bg-black">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-krona text-3xl md:text-4xl lg:text-5xl mb-6">
            WHY CHOOSE
            <span className="block text-[#E70606] mt-2">ANIMAZIONS</span>
          </h2>
          <p className="text-gray-400 font-jost text-lg max-w-2xl mx-auto">
            Experience the next generation of animation streaming with blockchain-powered
            ownership, security, and community engagement.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 hover:border-[#E70606] transition-all hover:scale-105 cursor-pointer"
              >
                <div className="w-16 h-16 bg-[#E70606] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="font-jost text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 font-jost leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-20 bg-gradient-to-r from-[#E70606] to-purple-600 rounded-3xl p-12 md:p-16 text-center">
          <h3 className="font-krona text-2xl md:text-3xl lg:text-4xl mb-6">
            READY TO START YOUR JOURNEY?
          </h3>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto font-jost">
            Join thousands of creators and collectors in the world's first Web 3.0 animation platform
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="bg-white text-black hover:bg-gray-100 px-8 py-4 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105">
              Get Started Free
            </button>
            <button className="border-2 border-white hover:bg-white hover:text-[#E70606] px-8 py-4 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105">
              Explore Platform
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
