import React, { useState, useEffect } from 'react';
import { Music2, Mic2, Play, Trash2, Calendar, Search, Loader2, Download } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const Gallery = () => {
  const [activeTab, setActiveTab] = useState('instrumentals'); // instrumentals, recordings
  const [songs, setSongs] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      if (activeTab === 'instrumentals') {
        const res = await axios.get('/api/songs', { headers });
        setSongs(res.data);
      } else {
        const res = await axios.get('/api/recordings', { headers });
        setRecordings(res.data);
      }
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/${type}/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const items = activeTab === 'instrumentals' ? songs : recordings;
  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto">
      
      {/* Header & Tabs */}
      {/* Header & Tabs */}
      {/* Header & Tabs */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">My Library</h1>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setActiveTab('instrumentals')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'instrumentals' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Instrumentals
            </button>
            <button 
              onClick={() => setActiveTab('recordings')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'recordings' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              My Recordings
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-purple-500" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-5 group hover:bg-white/5 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeTab === 'instrumentals' ? 'bg-purple-500/20 text-purple-400' : 'bg-pink-500/20 text-pink-400'}`}>
                    {activeTab === 'instrumentals' ? <Music2 size={24} /> : <Mic2 size={24} />}
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id, activeTab === 'instrumentals' ? 'songs' : 'recordings')}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="font-bold text-white truncate mb-1" title={item.title}>{item.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <Calendar size={12} />
                  {new Date(item.upload_date || item.created_at).toLocaleDateString()}
                </div>

                {/* Audio Player Logic */}
                <div className="mt-4">
                  {(activeTab === 'recordings' || (item.status === 'ready' && item.instrumental_url)) ? (
                    <div className="flex flex-col gap-2">
                       <audio 
                         controls 
                         src={activeTab === 'recordings' ? item.url : item.instrumental_url} 
                         className="w-full h-8 opacity-80 hover:opacity-100 transition-opacity" 
                         onPlay={(e) => {
                           // Pause other audios
                           document.querySelectorAll('audio').forEach(a => {
                             if(a !== e.target) a.pause();
                           });
                         }}
                       />
                       
                       {/* Download Button for Instrumentals */}
                       {activeTab === 'instrumentals' && (
                         <div className="flex justify-end">
                            <a 
                              href={item.instrumental_url} 
                              download
                              className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors"
                            >
                              <Download size={12} /> Download
                            </a>
                         </div>
                       )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full border ml-auto ${
                        item.status === 'processing' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 
                        'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {item.status}
                      </span>
                      {item.status === 'processing' && item.progress > 0 && (
                        <span className="text-xs text-slate-500">{item.progress}%</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-500">
              <p>No items found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Gallery;
