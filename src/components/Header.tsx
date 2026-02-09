
import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  HelpCircle, 
  Moon, 
  Sun, 
  User, 
  LogOut, 
  Settings, 
  ChevronDown, 
  Bot,
  Download,
  Share,
  PlusSquare,
  X,
  MoreVertical,
  CheckCircle2,
  ShoppingBag
} from 'lucide-react';
import { TabType } from '../types';
import { useAuth } from '../context/AuthContext';
import { getAssetUrl } from '../services/directus';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isDark: boolean;
  toggleTheme: () => void;
  toggleHelpCenter: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, isDark, toggleTheme, toggleHelpCenter }) => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle PWA Logic
  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isStandalone) {
      alert("App is already installed on your device.");
      setIsProfileOpen(false);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsProfileOpen(false);
    } else {
      setShowInstallModal(true);
      setIsProfileOpen(false);
    }
  };

  const getPageTitle = (tab: TabType) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'general': return 'General Settings';
      case 'appearance': return 'Bot Appearance';
      case 'knowledge': return 'Knowledge Base';
      case 'content-manager': return 'Content Manager';
      case 'integrations': return 'Integrations';
      case 'deploy': return 'Deploy & Code';
      case 'profile': return 'My Account';
      case 'manage-bots': return 'Manage Chatbots';
      case 'create-bot': return 'Create New Bot';
      case 'pricing': return 'Subscription Plans';
      case 'orders': return 'My Orders';
      case 'insights': return 'Analytics';
      case 'logs': return 'Chat History';
      default: return 'Dashboard';
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
  };

  const userAvatar = user?.avatar ? getAssetUrl(user.avatar) : null;
  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Guest User';
  
  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-[65px] px-4 flex items-center justify-between transition-colors duration-300 sticky top-0 z-30">
        
        {/* Left Side: Page Title */}
        <div className="hidden md:flex items-center gap-4">
          <h1 className="text-2xl font-black text-gray-800 dark:text-white transition-colors">
            {getPageTitle(activeTab)}
          </h1>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-3 ml-auto md:ml-0">
          
          {/* Help */}
          <button 
            onClick={toggleHelpCenter}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" 
            title="Help"
          >
            <HelpCircle size={20} />
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-amber-500 dark:text-gray-400 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <button className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 py-1.5 px-2 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 overflow-hidden">
                {userAvatar ? (
                  <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} />
                )}
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu - Aligned to Right edge of trigger for LTR */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-fade-in z-50">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button 
                    onClick={() => { setActiveTab('profile'); setIsProfileOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <User size={16} className="text-gray-400" />
                    My Profile
                  </button>
                  <button 
                    onClick={() => { setActiveTab('orders'); setIsProfileOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <ShoppingBag size={16} className="text-gray-400" />
                    My Subscription
                  </button>
                  <button 
                    onClick={() => { setActiveTab('manage-bots'); setIsProfileOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Bot size={16} className="text-gray-400" />
                    My Bots
                  </button>
                  <button 
                    onClick={() => { setActiveTab('general'); setIsProfileOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Settings size={16} className="text-gray-400" />
                    Settings
                  </button>
                  
                  <button 
                    onClick={handleInstallClick}
                    className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center gap-2 transition-colors font-medium"
                  >
                    {isStandalone ? <CheckCircle2 size={16} /> : <Download size={16} />}
                    {isStandalone ? 'App Installed' : 'Install App'}
                  </button>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-800 p-1">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Install Help Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowInstallModal(false)}>
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white">
                      {isIOS ? 'Install on iPhone' : 'Install Guide'}
                    </h3>
                    <button onClick={() => setShowInstallModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        To install the web app on your device, follow these steps:
                    </p>
                    
                    {isIOS ? (
                      <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold shrink-0">1</span>
                              <span>Tap the <span className="font-bold inline-flex items-center gap-1 mx-1 text-blue-600"><Share size={14} /> Share</span> button at the bottom of Safari.</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold shrink-0">2</span>
                              <span>Select <span className="font-bold inline-flex items-center gap-1 mx-1"><PlusSquare size={14} /> Add to Home Screen</span>.</span>
                          </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold shrink-0">1</span>
                              <span>Open the browser menu <span className="font-bold inline-flex items-center gap-1 mx-1 text-gray-500"><MoreVertical size={14} /></span>.</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold shrink-0">2</span>
                              <span>Select <span className="font-bold mx-1">Install App</span> or <span className="font-bold mx-1">Add to Home screen</span>.</span>
                          </div>
                      </div>
                    )}
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4">
                    <button 
                        onClick={() => setShowInstallModal(false)}
                        className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default Header;
