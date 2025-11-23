import React, { useState, useEffect, useRef } from 'react';
import { Upload, ArrowLeft, Copy, Check } from 'lucide-react';
import { Peer } from 'peerjs';
import type { DataConnection } from 'peerjs';
import { VideoPlayer, VideoPlayerHandle } from './VideoPlayer';
import { ChatSidebar } from './ChatSidebar';
import { User, ChatMessage, PeerData, VideoState } from '../types';

interface RoomProps {
  currentUser: User;
  onLeave: () => void;
  joinId?: string; // If joining a room
}

export const Room: React.FC<RoomProps> = ({ currentUser, onLeave, joinId }) => {
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([currentUser]);
  const [peerId, setPeerId] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | undefined>(undefined);
  const [remoteVideoState, setRemoteVideoState] = useState<Partial<VideoState> | null>(null);

  const videoPlayerRef = useRef<VideoPlayerHandle>(null);
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);
  
  // Initialize Peer
  useEffect(() => {
    let peer: Peer | null = null;
    
    try {
        peer = new Peer();
        peerRef.current = peer;

        peer.on('open', (id) => {
          if (!peer?.destroyed) {
              setPeerId(id);
              
              // If we are joining, connect to host immediately
              if (joinId && !currentUser.isHost) {
                connectToHost(id, joinId, peer);
              }
          }
        });

        peer.on('connection', (conn) => {
          handleDataConnection(conn);
        });

        peer.on('call', (call) => {
          // Guest receiving stream
          call.answer();
          call.on('stream', (stream) => {
            setRemoteStream(stream);
          });
        });

        peer.on('error', (err) => {
            console.error('PeerJS Error:', err);
        });

    } catch (e) {
        console.error('Failed to create Peer instance:', e);
    }

    return () => {
      if (peer) {
          peer.destroy();
      }
    };
  }, []);

  // Host: Broadcast Video State
  const broadcastVideoState = (state: Partial<VideoState>) => {
    if (!currentUser.isHost) return;
    const msg: PeerData = { type: 'SYNC', payload: state };
    connectionsRef.current.forEach(conn => conn.send(msg));
  };

  const handleDataConnection = (conn: DataConnection) => {
    connectionsRef.current.push(conn);

    conn.on('open', () => {
        // If I am host, send my user info to the new guest
        // If I am guest, send my info to host
        conn.send({ type: 'USER_JOINED', payload: currentUser });
    });

    conn.on('data', (data: unknown) => {
        const msg = data as PeerData;
        
        if (msg.type === 'CHAT') {
            setMessages(prev => [...prev, msg.payload]);
        } 
        else if (msg.type === 'SYNC') {
            if (!currentUser.isHost) {
                setRemoteVideoState(msg.payload);
            }
        }
        else if (msg.type === 'USER_JOINED') {
            const newUser = msg.payload;
            setUsers(prev => {
                if (prev.find(u => u.id === newUser.id)) return prev;
                return [...prev, newUser];
            });
            
            // If I am host, when a user joins, I need to stream video to them
            if (currentUser.isHost && videoPlayerRef.current) {
                const stream = videoPlayerRef.current.captureStream();
                if (stream && peerRef.current) {
                    peerRef.current.call(newUser.id, stream); // Call guest with stream
                }
                // Send current user list to the new guy
                users.forEach(u => {
                   conn.send({ type: 'USER_JOINED', payload: u });
                });
            }
        }
    });

    conn.on('close', () => {
       connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
    });
  };

  const connectToHost = (myId: string, hostId: string, peer: Peer) => {
      const conn = peer.connect(hostId);
      handleDataConnection(conn);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoFile(url);
      setFileName(file.name);
      
      // System message
      const sysMsg: ChatMessage = {
        id: Date.now().toString(),
        userId: 'system',
        userName: 'System',
        content: `Host loaded ${file.name}`,
        timestamp: Date.now(),
        isSystem: true
      };
      setMessages(prev => [...prev, sysMsg]);
      connectionsRef.current.forEach(c => c.send({ type: 'CHAT', payload: sysMsg }));
    }
  };

  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        content: text,
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMsg]);
    
    // Broadcast
    const pData: PeerData = { type: 'CHAT', payload: newMsg };
    connectionsRef.current.forEach(c => c.send(pData));
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(peerId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleVideoStateChange = (state: Partial<VideoState>) => {
      if (currentUser.isHost) {
          broadcastVideoState(state);
      }
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <header className="h-16 bg-brand-900 border-b border-brand-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center space-x-4">
            <button onClick={onLeave} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-xl tracking-tight text-white">
                Stream<span className="text-brand-500">Sync</span>
            </h1>
            {fileName && (
                <span className="hidden md:block text-sm text-gray-500 border-l border-gray-700 pl-4">
                    Playing: <span className="text-gray-300">{fileName}</span>
                </span>
            )}
        </div>

        <div className="flex items-center space-x-4">
            {currentUser.isHost && (
                <div className="flex items-center space-x-2 bg-brand-800 rounded-lg p-1 pr-3 border border-brand-700">
                    <span className="px-2 text-xs text-gray-400 font-medium">ROOM ID</span>
                    <code className="text-sm font-mono text-brand-300">{peerId || 'Loading...'}</code>
                    <button 
                        onClick={copyRoomId}
                        className="p-1.5 hover:bg-brand-700 rounded transition-colors text-gray-400 hover:text-white"
                        title="Copy Room ID"
                    >
                        {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                </div>
            )}
            {!currentUser.isHost && (
                <div className="flex items-center space-x-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm font-medium">Connected to Host</span>
                </div>
            )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Video Area */}
        <div className="flex-1 bg-black flex items-center justify-center relative">
          {(videoFile || (!currentUser.isHost && remoteStream)) ? (
            <VideoPlayer 
                ref={videoPlayerRef}
                src={videoFile || undefined} 
                stream={remoteStream}
                isHost={currentUser.isHost}
                onStateChange={handleVideoStateChange}
                remoteState={remoteVideoState}
            />
          ) : (
            <div className="text-center p-8 max-w-md">
                {currentUser.isHost ? (
                    <>
                        <div className="w-20 h-20 bg-brand-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-700 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
                            <Upload size={32} className="text-brand-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Select a Movie</h2>
                        <p className="text-gray-400 mb-8">
                            Select a video file from your computer. We will stream it directly to your connected friends via WebRTC.
                        </p>
                        
                        <label className="relative inline-flex group cursor-pointer">
                            <div className="absolute transition-all duration-1000 opacity-70 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200 animate-tilt"></div>
                            <button className="relative inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white transition-all duration-200 bg-brand-900 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 pointer-events-none">
                                Choose File
                            </button>
                            <input 
                                type="file" 
                                accept="video/*" 
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </label>
                    </>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mb-4"></div>
                        <h2 className="text-xl font-bold">Waiting for Host...</h2>
                        <p className="text-gray-400 mt-2">The host hasn't started a movie yet.</p>
                    </div>
                )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <ChatSidebar 
            messages={messages} 
            users={users} 
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};