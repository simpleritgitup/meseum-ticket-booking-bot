"use client";

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import { checkHealth } from '@/services/api';

// Define the Message and Conversation types
interface Message {
  id: number;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Conversation {
  id: number;
  name: string;
  messages: Message[];
  sessionId?: string;
}

// Login component
function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcoded credentials
    const validEmail = 'admin@gmail.com';
    const validPassword = 'admin@123';

    if (email === validEmail && password === validPassword) {
      setError('');
      onLogin(); // Trigger successful login
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="flex h-screen bg-[#f9fafb] items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login to City Museum & Zoo</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm mb-4 text-center">{error}</div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check backend health on load
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const isHealthy = await checkHealth();
        setIsBackendConnected(isHealthy);
      } catch (error) {
        console.error('Error checking backend health:', error);
        setIsBackendConnected(false);
      }
    };
    
    checkBackendHealth();
  }, []);

  // Load conversations from localStorage or initialize with a single empty conversation
  useEffect(() => {
    if (!isAuthenticated) return; // Skip if not authenticated

    const savedConversations = localStorage.getItem('conversations');
    
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        // Convert string timestamps back to Date objects
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        
        setConversations(conversationsWithDates);
        
        // Set active conversation to the first one if available
        if (conversationsWithDates.length > 0) {
          setActiveConversation(conversationsWithDates[0].id);
        }
      } catch (error) {
        console.error('Error parsing saved conversations:', error);
        initializeWithEmptyConversation();
      }
    } else {
      initializeWithEmptyConversation();
    }
  }, [isAuthenticated]);

  const initializeWithEmptyConversation = () => {
    const newConversation = { 
      id: 1, 
      name: 'New Chat', 
      messages: [] 
    };
    setConversations([newConversation]);
    setActiveConversation(1);
  };

  const addNewConversation = () => {
    const newId = conversations.length > 0 ? Math.max(...conversations.map(c => c.id)) + 1 : 1;
    const newConversation = { id: newId, name: 'New Chat', messages: [] };
    
    setConversations([newConversation, ...conversations]);
    setActiveConversation(newId);
  };

  const deleteConversation = (id: number) => {
    const updatedConversations = conversations.filter(c => c.id !== id);
    
    setConversations(updatedConversations);
    
    if (activeConversation === id) {
      if (updatedConversations.length > 0) {
        setActiveConversation(updatedConversations[0].id);
      } else {
        addNewConversation();
      }
    }
  };

  const clearAllConversations = () => {
    const newConversation = { 
      id: Date.now(), 
      name: 'New Chat', 
      messages: [] 
    };
    
    setConversations([newConversation]);
    setActiveConversation(newConversation.id);
  };

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Handle successful login
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <>
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="flex h-screen bg-[#f9fafb]">
          {isBackendConnected === false && (
            <div className="fixed top-0 left-0 right-0 bg-yellow-100 text-yellow-800 py-2 px-4 text-center z-50">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  Running in offline mode. Backend server not connected. 
                  <button 
                    onClick={() => window.location.reload()}
                    className="ml-2 underline hover:text-yellow-900"
                  >
                    Retry Connection
                  </button>
                </span>
              </div>
            </div>
          )}
          
          <Sidebar 
            conversations={conversations}
            activeConversation={activeConversation}
            setActiveConversation={setActiveConversation}
            addNewConversation={addNewConversation}
            deleteConversation={deleteConversation}
            clearAllConversations={clearAllConversations}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
          
          {activeConversation !== null && (
            <ChatInterface 
              conversation={conversations.find(c => c.id === activeConversation) || conversations[0]}
              setConversations={setConversations}
              conversations={conversations}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
            />
          )}
        </div>
      )}
    </>
  );
}