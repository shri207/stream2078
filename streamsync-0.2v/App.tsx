import React, { useState } from 'react';
import { Landing } from './components/Landing';
import { Room } from './components/Room';
import { User, AppView } from './types';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [joinId, setJoinId] = useState<string | undefined>(undefined);

  const handleHost = () => {
    // Generate random host ID or just use PeerJS auto-gen
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Host',
      avatar: `https://picsum.photos/seed/${Date.now()}/100`,
      isHost: true
    };
    setCurrentUser(user);
    setJoinId(undefined);
    setCurrentView(AppView.ROOM);
  };

  const handleJoin = (id: string) => {
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Guest ' + Math.floor(Math.random() * 100),
      avatar: `https://picsum.photos/seed/${Date.now()}/100`,
      isHost: false
    };
    setCurrentUser(user);
    setJoinId(id);
    setCurrentView(AppView.ROOM);
  };

  const handleLeave = () => {
    setCurrentView(AppView.LANDING);
    setCurrentUser(null);
    setJoinId(undefined);
  };

  return (
    <div className="font-sans antialiased text-white">
      {currentView === AppView.LANDING && (
        <Landing onHost={handleHost} onJoin={handleJoin} />
      )}
      
      {currentView === AppView.ROOM && currentUser && (
        <Room 
          currentUser={currentUser} 
          onLeave={handleLeave}
          joinId={joinId}
        />
      )}
    </div>
  );
}

export default App;