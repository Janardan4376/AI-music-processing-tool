import React from 'react';
import { motion } from 'framer-motion';
import { Play, Music, Mic2, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center gap-12">
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl mx-auto"
      >
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-300">AI-Powered Music Studio</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Unleash Your
          </span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Inner Artist
          </span>
        </h1>
        
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Transform any song into a karaoke masterpiece. Remove vocals, record your voice, and mix like a pro with our next-gen AI audio engine.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/remove-vocals" className="btn btn-primary px-8 py-4 text-lg rounded-full shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] transition-shadow">
            <Layers className="mr-2" /> Start Creating
          </Link>
          <Link to="/gallery" className="btn btn-secondary px-8 py-4 text-lg rounded-full">
            <Music className="mr-2" /> My Library
          </Link>
        </div>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-12">
        {[
          { icon: Layers, title: "Vocal Remover", desc: "Isolate instrumentals with precision AI.", color: "from-blue-500 to-cyan-500" },
          { icon: Mic2, title: "Studio Recording", desc: "Record high-fidelity vocals over tracks.", color: "from-purple-500 to-pink-500" },
          { icon: Music, title: "Smart Lyrics", desc: "Auto-synced lyrics for perfect timing.", color: "from-amber-500 to-orange-500" }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="glass-card p-8 hover:bg-white/5 transition-colors group"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
              <feature.icon size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
            <p className="text-slate-400">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

    </div>
  );
};

export default Home;
