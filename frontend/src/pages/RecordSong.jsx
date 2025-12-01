import React, { useState, useEffect } from 'react';
import { Music2, Mic2, Play, Search, Loader2 } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import KaraokePlayer from '../components/KaraokePlayer';
import { useAuth } from '../context/AuthContext';

const RecordSong = () => {
  const [selectedSong, setSelectedSong] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/songs', { headers: { 'Authorization': `Bearer ${token}` } });
      // Filter only ready songs
      setSongs(res.data.filter(s => s.status === 'ready'));
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedSong) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full"
      >
        <KaraokePlayer 
          song={selectedSong} 
          user={user} 
          onBack={() => setSelectedSong(null)} 
        />
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Studio Session</h1>
        <p className="text-slate-400">Select a track to start recording</p>
      </div>

      <div className="relative max-w-md mx-auto mb-10">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input 
          type="text" 
          placeholder="Search tracks..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="animate-spin text-purple-500" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSongs.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedSong(song)}
              className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all hover:scale-[1.02] border border-transparent hover:border-purple-500/30"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-900 to-slate-900 flex items-center justify-center shadow-inner">
                <Music2 className="text-purple-400" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate" title={song.title}>
                  {(() => {
                    const cleanTitle = song.title.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
                    const words = cleanTitle.split(' ');
                    return words.length > 5 ? words.slice(0, 5).join(' ') + '...' : cleanTitle;
                  })()}
                </h3>
                <p className="text-xs text-slate-400">Ready to record</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                <Mic2 size={18} className="text-white" />
              </div>
            </motion.div>
          ))}

          {filteredSongs.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500">
              <p>No ready tracks found. Go to "Remove Vocals" to add some!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordSong;
