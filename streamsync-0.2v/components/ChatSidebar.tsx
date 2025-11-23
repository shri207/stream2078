import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageSquare, Crown } from 'lucide-react';
import { ChatMessage, User } from '../types';

interface ChatSidebarProps {
  messages: ChatMessage[];
  users: User[];
  currentUser: User;
  onSendMessage: (text: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ messages, users, currentUser, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'users'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-800 border-l border-brand-700/50 w-full max-w-sm">
      {/* Tabs */}
      <div className="flex border-b border-brand-700/50">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
            activeTab === 'chat' 
              ? 'text-white border-b-2 border-brand-500 bg-brand-700/20' 
              : 'text-gray-400 hover:text-white hover:bg-brand-700/10'
          }`}
        >
          <MessageSquare size={16} />
          <span>Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
            activeTab === 'users' 
              ? 'text-white border-b-2 border-brand-500 bg-brand-700/20' 
              : 'text-gray-400 hover:text-white hover:bg-brand-700/10'
          }`}
        >
          <Users size={16} />
          <span>Friends ({users.length})</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chat' ? (
          <div className="flex flex-col p-4 space-y-4 min-h-full justify-end">
            <div className="flex-1" /> {/* Spacer to push messages down */}
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.userId === currentUser.id ? 'items-end' : 'items-start'}`}
              >
                {!msg.isSystem && (
                   <span className="text-xs text-gray-400 mb-1 ml-1">{msg.userName}</span>
                )}
               
                <div 
                  className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm break-words ${
                    msg.isSystem 
                      ? 'bg-transparent text-center text-gray-500 w-full italic text-xs' 
                      : msg.userId === currentUser.id 
                        ? 'bg-brand-500 text-white rounded-tr-sm' 
                        : 'bg-brand-700 text-gray-100 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-brand-700/30 transition-colors">
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-brand-700 object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium text-white">{user.name}</span>
                    {user.isHost && (
                      <Crown size={14} className="ml-2 text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                  <span className="text-xs text-green-400 flex items-center mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                    Watching
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area (Only for chat) */}
      {activeTab === 'chat' && (
        <div className="p-4 border-t border-brand-700/50 bg-brand-800">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Say something..."
              className="flex-1 bg-brand-900 border border-brand-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-gray-500 text-sm"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-brand-500 text-white p-2.5 rounded-lg hover:bg-brand-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};