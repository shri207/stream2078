import React, { useState } from 'react';
import { PlayCircle, Users, Tv, ArrowRight, Video } from 'lucide-react';

interface LandingProps {
  onHost: () => void;
  onJoin: (id: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ onHost, onJoin }) => {
  const [roomId, setRoomId] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-900 to-brand-800 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Hero */}
        <div className="space-y-8">
          <div className="inline-flex items-center space-x-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></span>
            <span className="text-brand-400 text-sm font-medium">Local High-Quality Streaming</span>
          </div>
          
          <h1 className="text-5xl font-bold leading-tight">
            Watch movies with friends, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-pink-500">synced perfectly.</span>
          </h1>
          
          <p className="text-gray-400 text-lg leading-relaxed">
            Stream directly from your local file system to your friends using WebRTC. 
            No cloud uploads, just pure peer-to-peer streaming.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onHost}
              className="flex items-center justify-center space-x-2 bg-brand-500 hover:bg-brand-400 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-brand-500/25"
            >
              <Video size={20} />
              <span>Host a Party</span>
            </button>
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl opacity-50 group-hover:opacity-100 transition duration-200 blur"></div>
                <div className="relative flex items-center bg-brand-900 rounded-xl p-1">
                    <input 
                        type="text" 
                        placeholder="Enter Room ID..." 
                        className="bg-transparent text-white px-4 py-3 outline-none w-40 placeholder-gray-600"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    />
                    <button 
                        onClick={() => roomId && onJoin(roomId)}
                        disabled={!roomId}
                        className="bg-brand-800 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg transition-colors"
                    >
                        Join
                    </button>
                </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-8 text-gray-500 text-sm pt-4">
            <div className="flex items-center space-x-2">
                <Users size={16} />
                <span>P2P Encrypted</span>
            </div>
            <div className="flex items-center space-x-2">
                <Tv size={16} />
                <span>Live Stream</span>
            </div>
          </div>
        </div>

        {/* Right Side: Graphic */}
        <div className="relative hidden md:block">
            <div className="absolute -inset-4 bg-brand-500/20 rounded-full blur-3xl"></div>
            <div className="relative bg-brand-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative mb-4">
                    <img src="https://picsum.photos/800/450" alt="Movie Thumbnail" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
                            <PlayCircle size={48} className="text-white" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500"></div>
                    <div className="flex-1">
                        <div className="h-2 w-24 bg-white/20 rounded mb-2"></div>
                        <div className="h-2 w-16 bg-white/10 rounded"></div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};