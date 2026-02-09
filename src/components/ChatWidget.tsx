
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, RefreshCw, Sparkles, Tag, Maximize2, Minimize2, MoreVertical, Moon, Sun, Phone, Instagram, MessageCircle, MapPin } from 'lucide-react';
import { BotConfig, Message } from '../types';
import { getAssetUrl } from '../services/directus';

const DIRECTUS_URL = process.env.DIRECTUS_CRM_URL;

const ChatWidget: React.FC = () => {
  const [config, setConfig] = useState<Partial<BotConfig>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Customization State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('sm');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substring(2)}`);

  // Load Preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('megalive_client_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    const savedSize = localStorage.getItem('megalive_client_fontsize') as 'sm' | 'base' | 'lg';
    if (savedSize) setFontSize(savedSize);
  }, []);

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('megalive_client_theme', theme);
  }, [theme]);

  // Apply Font Size Persistence
  useEffect(() => {
    localStorage.setItem('megalive_client_fontsize', fontSize);
  }, [fontSize]);

  // Click Outside Settings
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFullscreen = () => {
    const newState = !isFullscreen;
    setIsFullscreen(newState);
    // Send message to parent
    window.parent.postMessage({ type: 'MEGALIVE_TOGGLE_FULLSCREEN', value: newState }, '*');
  };

  const getMessageTextSize = () => {
    if (fontSize === 'lg') return 'text-base';
    if (fontSize === 'base') return 'text-sm';
    return 'text-xs';
  };

  // Simple markdown to HTML parser for AI responses
  const markdownToHtml = (text: string): string => {
    const boldedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const lines = boldedText.split('\n');
    const isStandardList = lines.length > 1 && lines.some(line => line.trim().startsWith('* ') || line.trim().startsWith('- '));
    if (isStandardList) {
        let html = '';
        let inList = false;
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                html += `<li>${trimmed.substring(2)}</li>`;
            } else {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                if (trimmed) {
                    html += `<p>${trimmed}</p>`;
                }
            }
        }
        if (inList) html += '</ul>';
        return html;
    }
    const inlineParts = boldedText.split(/\s\*\s/);
    if (inlineParts.length > 1) {
        let html = `<p>${inlineParts[0]}</p><ul>`;
        for (let i = 1; i < inlineParts.length; i++) {
            html += `<li>${inlineParts[i]}</li>`;
        }
        html += '</ul>';
        return html;
    }
    return lines.filter(line => line.trim()).map(line => `<p>${line}</p>`).join('');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const botId = params.get('id');

    if (!botId) {
      setError("Bot ID is missing.");
      setIsConfigLoading(false);
      return;
    }

    const fetchConfig = async () => {
      try {
        const publicFields = [
          'id', 'chatbot_name', 'chabot_title', 'chatbot_welcome', 'chatbot_logo', 
          'chatbot_color', 'chatbot_input', 'chatbot_suggestion', 'chatbot_active', 'chatbot_webhook',
          'chatbot_phone', 'chatbot_instagram', 'chatbot_whatsapp', 'chatbot_telegram',
          'chatbot_address', 'chatbot_location'
        ].join(',');
        
        const response = await fetch(`${DIRECTUS_URL}/items/chatbot?filter[id][_eq]=${botId}&fields=${publicFields}&limit=1`);

        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.statusText} (${response.status})`);
        }
        const responseJson = await response.json();
        const data = responseJson.data?.[0]; 

        if (!data) {
          throw new Error(`Bot with ID ${botId} not found or permission denied.`);
        }
        
        const fetchedConfig: Partial<BotConfig> = {
          id: data.id,
          name: data.chatbot_name,
          description: data.chabot_title,
          welcomeMessage: data.chatbot_welcome,
          logoUrl: data.chatbot_logo ? getAssetUrl(data.chatbot_logo) : undefined,
          primaryColor: data.chatbot_color,
          chatInputPlaceholder: data.chatbot_input,
          suggestions: data.chatbot_suggestion,
          isActive: data.chatbot_active,
          n8nWebhookUrl: data.chatbot_webhook,
          phone: data.chatbot_phone,
          instagram: data.chatbot_instagram,
          whatsapp: data.chatbot_whatsapp,
          telegram: data.chatbot_telegram,
          address: data.chatbot_address,
          location: data.chatbot_location,
        };

        setConfig(fetchedConfig);
        
        if (fetchedConfig.welcomeMessage) {
          setMessages([{
            id: 'welcome', role: 'model', text: fetchedConfig.welcomeMessage, timestamp: Date.now()
          }]);
        }

      } catch (err) {
        console.error(err);
        setError("Could not load bot configuration.");
      } finally {
        setIsConfigLoading(false);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isResponseLoading]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isResponseLoading || !config.n8nWebhookUrl) return;

    const userMsg: Message = {
      id: Date.now().toString(), role: 'user', text: textToSend, timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsResponseLoading(true);

    try {
      const response = await fetch(config.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: config.id,
          sessionId: sessionIdRef.current,
          chatInput: textToSend,
          action: 'chat'
        })
      });

      if (!response.ok) throw new Error("Network response error.");

      const data = await response.json();
      
      function extractTextFromN8N(responseData: any): string | null {
          if (!responseData) return null;
          if (typeof responseData === 'string') {
              try { responseData = JSON.parse(responseData); } catch (e) { return responseData; }
          }
          const findText = (d: any): string | null => {
              if (!d) return null;
              if (typeof d === 'string') return d;
              if (typeof d !== 'object') return null;
              const keys = ['text', 'output', 'answer', 'message'];
              for (const key of keys) {
                  if (typeof d[key] === 'string' && d[key].trim() !== '') { return d[key]; }
              }
              if (d.json) {
                  const nestedText = findText(d.json);
                  if (nestedText) return nestedText;
              }
              return null;
          }
          if (Array.isArray(responseData) && responseData.length > 0) {
              const text = findText(responseData[0]);
              if (text) return text;
          }
          if (typeof responseData === 'object' && !Array.isArray(responseData)) {
              const text = findText(responseData);
              if (text) return text;
          }
          return null;
      }
      
      const responseText = extractTextFromN8N(data) || "No valid response received from server. Please check the Webhook JSON structure.";

      const botMsg: Message = {
        id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      console.error("Error sending message:", err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(), role: 'model', text: "Error connecting to server. Please check your internet connection or Webhook CORS settings.", timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsResponseLoading(false);
    }
  };

  const handleRestart = () => {
    if (config.welcomeMessage) {
        setMessages([{
        id: 'welcome_restart', role: 'model', text: config.welcomeMessage, timestamp: Date.now()
        }]);
    } else {
        setMessages([]);
    }
    sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    setTheme('light');
    setFontSize('sm');
    localStorage.removeItem('megalive_client_theme');
    localStorage.removeItem('megalive_client_fontsize');
    if (isFullscreen) {
        setIsFullscreen(false);
        window.parent.postMessage({ type: 'MEGALIVE_TOGGLE_FULLSCREEN', value: false }, '*');
    }
    setShowSettings(false);
  };
  
  if (isConfigLoading) {
     return <div className="flex items-center justify-center h-full text-gray-400 bg-white dark:bg-gray-900">Loading...</div>;
  }
  
  if (error) {
     return <div className="flex items-center justify-center h-full text-red-500 p-4 text-center bg-white dark:bg-gray-900">{error}</div>;
  }

  const getInstagramUrl = (handle: string) => handle.startsWith('http') ? handle : `https://instagram.com/${handle.replace('@', '')}`;
  const getTelegramUrl = (handle: string) => handle.startsWith('http') ? handle : `https://t.me/${handle.replace('@', '')}`;
  const getWhatsAppUrl = (number: string) => number.startsWith('http') ? number : `https://wa.me/${number.replace(/[^0-9+]/g, '')}`;

  return (
    <div className={`flex flex-col h-full w-full max-w-sm mx-auto relative transition-colors bg-white dark:bg-gray-900 border-[1px] border-gray-200 dark:border-gray-800 ${isFullscreen ? 'max-w-none rounded-none' : 'rounded-[1.5rem]'}`} dir="ltr">
      {/* Header */}
      <div 
        className={`p-4 flex items-center justify-between text-white transition-all ${isFullscreen ? '' : 'rounded-t-[1.4rem]'}`}
        style={{ backgroundColor: config.primaryColor || '#3b82f6' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm overflow-hidden border border-white/10">
             {config.logoUrl ? <img src={config.logoUrl} alt="Bot" className="w-full h-full object-cover" /> : <Bot size={20}/>}
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm">{config.name || 'Chatbot'}</h3>
            <div className="flex items-center gap-1.5 opacity-90">
              <span className={`w-1.5 h-1.5 rounded-full ${config.isActive !== false ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
              <p className="text-xs">{config.isActive !== false ? 'Online' : 'Offline'}</p>
            </div>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1">
            <div className="relative" ref={settingsRef}>
                <button 
                    onClick={() => setShowSettings(!showSettings)} 
                    className={`p-2 hover:bg-white/20 rounded-full transition-colors ${showSettings ? 'bg-white/20' : ''}`} 
                    title="Settings"
                >
                    <MoreVertical size={18} />
                </button>
                
                {/* Settings Popover */}
                {showSettings && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50 text-gray-800 dark:text-white flex flex-col gap-2 animate-fade-in-widget">
                        
                        {/* Phone Number */}
                        {config.phone && (
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <span className="text-sm font-medium truncate max-w-[120px]">{config.phone}</span>
                                <a 
                                    href={`tel:${config.phone}`} 
                                    className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400 transition-colors"
                                    title="Call"
                                >
                                    <Phone size={14} />
                                </a>
                            </div>
                        )}

                        {/* Social Media Links */}
                        {(config.instagram || config.whatsapp || config.telegram) && (
                           <>
                             {config.whatsapp && (
                                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <span className="text-sm font-medium truncate max-w-[120px]">{config.whatsapp.replace('https://wa.me/', '')}</span>
                                    <a 
                                        href={getWhatsAppUrl(config.whatsapp)} 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400 transition-colors"
                                    >
                                        <MessageCircle size={14} />
                                    </a>
                                </div>
                             )}
                             {config.instagram && (
                                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <span className="text-sm font-medium truncate max-w-[120px]">{config.instagram.replace('https://instagram.com/', '')}</span>
                                    <a 
                                        href={getInstagramUrl(config.instagram)} 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-pink-100 hover:text-pink-600 dark:hover:bg-pink-900/30 dark:hover:text-pink-400 transition-colors"
                                    >
                                        <Instagram size={14} />
                                    </a>
                                </div>
                             )}
                             
                             {config.telegram && (
                                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <span className="text-sm font-medium truncate max-w-[120px]">{config.telegram.replace('https://t.me/', '')}</span>
                                    <a 
                                        href={getTelegramUrl(config.telegram)} 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                                    >
                                        <Send size={14} />
                                    </a>
                                </div>
                             )}
                             <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                           </>
                        )}
                        
                        {/* Address Section */}
                        {config.address && (
                            <>
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-3">
                                <span className="text-xs font-medium text-left flex-1 leading-snug">{config.address}</span>
                                <a 
                                    href={config.location ? `https://www.google.com/maps/search/?api=1&query=${config.location.coordinates[1]},${config.location.coordinates[0]}` : '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors flex-shrink-0"
                                >
                                    <MapPin size={14} />
                                </a>
                            </div>
                            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                            </>
                        )}

                        {/* Theme */}
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                             <span className="text-xs font-medium">Display Mode</span>
                             <button 
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                                className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                             >
                                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                             </button>
                        </div>

                        {/* Fullscreen Toggle */}
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                             <span className="text-xs font-medium">Window Size</span>
                             <button 
                                onClick={toggleFullscreen} 
                                className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                             >
                                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                             </button>
                        </div>

                        {/* Font Size */}
                        <div className="p-2">
                            <span className="text-xs font-medium block mb-2 text-gray-600 dark:text-gray-400">Text Size</span>
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button onClick={() => setFontSize('sm')} className={`flex-1 flex items-center justify-center py-1 rounded-md text-[10px] transition-all ${fontSize === 'sm' ? 'bg-white dark:bg-gray-600 shadow-sm font-bold text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>A-</button>
                                <button onClick={() => setFontSize('base')} className={`flex-1 flex items-center justify-center py-1 rounded-md text-xs transition-all ${fontSize === 'base' ? 'bg-white dark:bg-gray-600 shadow-sm font-bold text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>A</button>
                                <button onClick={() => setFontSize('lg')} className={`flex-1 flex items-center justify-center py-1 rounded-md text-sm transition-all ${fontSize === 'lg' ? 'bg-white dark:bg-gray-600 shadow-sm font-bold text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>A+</button>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                        
                        <button onClick={handleRestart} className="flex items-center gap-2 p-2 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg w-full transition-colors">
                             <RefreshCw size={14} />
                             <span>Reset Settings</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950 transition-colors" ref={scrollRef}>
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in-widget`}
            style={{ animationDelay: `${index * 50}ms`}}
          >
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs border border-transparent
              ${msg.role === 'user' ? 'bg-gray-400 dark:bg-gray-600' : ''}`}
              style={msg.role === 'model' ? { backgroundColor: config.primaryColor } : {}}
            >
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div
              className={`max-w-[85%] p-3 rounded-2xl leading-relaxed shadow-sm ${getMessageTextSize()}
                ${msg.role === 'user' 
                  ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700' 
                  : 'text-white rounded-br-none chat-content'
                }`}
              style={msg.role === 'model' ? { backgroundColor: config.primaryColor } : {}}
            >
              {msg.role === 'model' ? (
                <div dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.text) }} />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {isResponseLoading && (
          <div className="flex items-end gap-2 animate-fade-in-widget">
             <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: config.primaryColor }}>
                <Bot size={14} />
             </div>
             <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 rounded-2xl rounded-br-none shadow-sm">
               <div className="flex gap-1">
                 <span className="w-2 h-2 bg-gray-300 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                 <span className="w-2 h-2 bg-gray-300 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                 <span className="w-2 h-2 bg-gray-300 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Suggestion Chips & Input */}
      <div className={`bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 transition-colors ${isFullscreen ? '' : 'rounded-b-[1.4rem]'}`}>
        {config.suggestions && config.suggestions.length > 0 && messages.length <= 1 && (
           <div className="px-4 pt-3 flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth: 'none'}}>
              {config.suggestions.map((suggestion, idx) => (
                  <button
                     key={idx}
                     onClick={() => handleSend(suggestion)}
                     disabled={isResponseLoading}
                     className="flex-shrink-0 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full transition-all border border-gray-200 dark:border-gray-700 whitespace-nowrap flex items-center gap-1 group"
                  >
                      <Tag size={10} className="text-gray-400 dark:text-gray-500 group-hover:text-blue-400" />
                      {suggestion}
                  </button>
              ))}
           </div>
        )}

        <div className="p-4">
            <div className="relative flex items-center">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={config.chatInputPlaceholder || "Type your message..."}
                disabled={config.isActive === false || isResponseLoading}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full py-3 pr-4 pl-12 text-sm focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all text-gray-800 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isResponseLoading || config.isActive === false}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/20"
                style={{ backgroundColor: config.primaryColor }}
            >
                <Send size={16} className={isResponseLoading ? 'opacity-0' : ''} />
                {isResponseLoading && <Sparkles size={16} className="absolute top-2 left-2 animate-spin" />}
            </button>
            </div>
            <div className="text-center mt-2">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">Powered by BotSleek.com</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
