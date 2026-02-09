
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, RefreshCw, Sparkles, Tag, Maximize2, Minimize2, MoreVertical, Moon, Sun, Phone, Instagram, MessageCircle, MapPin } from 'lucide-react';
import { BotConfig, Message } from '../types';

interface ChatPreviewProps {
  config: BotConfig;
}

const ChatPreview: React.FC<ChatPreviewProps> = ({ config }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Customization State
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('sm');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>(`preview_session_${Date.now()}`);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
        setTheme('dark');
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    if (config.welcomeMessage) {
       setMessages([{
        id: 'welcome', role: 'model', text: config.welcomeMessage, timestamp: Date.now()
      }]);
       sessionIdRef.current = `preview_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
  }, [config.name, config.welcomeMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, fontSize]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(), role: 'user', text: textToSend, timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (!config.n8nWebhookUrl || config.n8nWebhookUrl === 'https://your-n8n-instance.com/webhook/test') {
        const errorMsg: Message = {
            id: (Date.now() + 1).toString(), role: 'model', text: "Error: Webhook URL is not configured for this bot.", timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMsg]);
        setLoading(false);
        return;
    }

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

        if (!response.ok) throw new Error(`Network error: ${response.statusText}`);

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
        
        const responseText = extractTextFromN8N(data) || "No valid response from server. Check Webhook JSON structure.";

        const botMsg: Message = {
            id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now()
        };
        setMessages(prev => [...prev, botMsg]);

    } catch (err) {
        console.error("Error sending message in preview:", err);
        let errorMessageText = "Connection error with chatbot server.";
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
            errorMessageText = "Error: Could not connect to Webhook. This is likely due to CORS settings on your N8N server.";
        }
        const errorMsg: Message = {
            id: (Date.now() + 1).toString(), role: 'model', text: errorMessageText, timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setLoading(false);
    }
  };

  const handleRestart = () => {
    if (config.welcomeMessage) {
        setMessages([{
        id: 'welcome', role: 'model', text: config.welcomeMessage, timestamp: Date.now()
        }]);
    } else {
        setMessages([]);
    }
    sessionIdRef.current = `preview_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    setTheme('light');
    setFontSize('sm');
    setIsFullscreen(false);
    setShowSettings(false);
  };

  const getMessageTextSize = () => {
    if (fontSize === 'lg') return 'text-base';
    if (fontSize === 'base') return 'text-sm';
    return 'text-xs';
  };

  const getInstagramUrl = (handle: string) => handle.startsWith('http') ? handle : `https://instagram.com/${handle.replace('@', '')}`;
  const getTelegramUrl = (handle: string) => handle.startsWith('http') ? handle : `https://t.me/${handle.replace('@', '')}`;
  const getWhatsAppUrl = (number: string) => number.startsWith('http') ? number : `https://wa.me/${number.replace(/[^0-9+]/g, '')}`;

  return (
    <div className={`h-full w-full flex flex-col items-center justify-center`} dir="ltr">
    <div className={`
      ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
      border-[1px] rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col w-full max-w-sm mx-auto relative transition-all duration-300
      ${isFullscreen ? 'h-[700px] max-w-md' : 'h-[600px]'}
    `}>
      {/* Header */}
      <div className={`p-4 flex items-center justify-between text-white transition-all ${isFullscreen ? '' : 'rounded-t-[1.4rem]'}`} style={{ backgroundColor: config.primaryColor }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm overflow-hidden border border-white/10">
             <img src={config.logoUrl} alt="Bot" className="w-full h-full object-cover" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm">{config.name}</h3>
            <p className="text-xs text-white/80 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${config.isActive !== false ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
              {config.isActive !== false ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
            <div className="relative" ref={settingsRef}>
                <button onClick={() => setShowSettings(!showSettings)} className={`p-2 hover:bg-white/20 rounded-full transition-colors ${showSettings ? 'bg-white/20' : ''}`}><MoreVertical size={18} /></button>
                {showSettings && (
                    <div className={`absolute right-0 top-full mt-2 w-72 rounded-xl shadow-xl border p-2 z-50 flex flex-col gap-2 animate-fade-in ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
                        {config.phone && (
                            <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                                <span className="text-sm font-medium text-left truncate max-w-[120px]">{config.phone}</span>
                                <a href={`tel:${config.phone}`} className={`p-1.5 rounded-full transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-green-900/30 hover:text-green-400' : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'}`}><Phone size={14} /></a>
                            </div>
                        )}
                        {(config.instagram || config.whatsapp || config.telegram) && (
                           <>
                           {config.whatsapp && (
                                <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                                    <span className="text-sm font-medium text-left truncate max-w-[120px]">{config.whatsapp.replace('https://wa.me/', '')}</span>
                                    <a href={getWhatsAppUrl(config.whatsapp)} target="_blank" rel="noopener noreferrer" className={`p-1.5 rounded-full transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-green-900/30 hover:text-green-400' : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'}`}><MessageCircle size={14} /></a>
                                </div>
                             )}
                             {config.instagram && (
                                <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                                    <span className="text-sm font-medium text-left truncate max-w-[120px]">{config.instagram.replace('https://instagram.com/', '')}</span>
                                    <a href={getInstagramUrl(config.instagram)} target="_blank" rel="noopener noreferrer" className={`p-1.5 rounded-full transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-pink-900/30 hover:text-pink-400' : 'bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-600'}`}><Instagram size={14} /></a>
                                </div>
                             )}
                             {config.telegram && (
                                <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                                    <span className="text-sm font-medium text-left truncate max-w-[120px]">{config.telegram.replace('https://t.me/', '')}</span>
                                    <a href={getTelegramUrl(config.telegram)} target="_blank" rel="noopener noreferrer" className={`p-1.5 rounded-full transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-blue-900/30 hover:text-blue-400' : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'}`}><Send size={14} /></a>
                                </div>
                             )}
                             <div className={`h-px my-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                           </>
                        )}
                        {config.address && (
                            <>
                            <div className={`flex items-center justify-between p-2 rounded-lg transition-colors gap-3 ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                                <span className="text-xs font-medium text-left flex-1 leading-snug">{config.address}</span>
                                <a href={config.location ? `https://www.google.com/maps/search/?api=1&query=${config.location.coordinates[1]},${config.location.coordinates[0]}` : '#'} target="_blank" rel="noopener noreferrer" className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-red-900/30 hover:text-red-400' : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'}`}><MapPin size={14} /></a>
                            </div>
                            <div className={`h-px my-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                            </>
                        )}
                        <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                             <span className="text-xs font-medium">Appearance</span>
                             <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-1.5 rounded-full transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}</button>
                        </div>
                         <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                             <span className="text-xs font-medium">Window Size</span>
                             <button onClick={() => setIsFullscreen(!isFullscreen)} className={`p-1.5 rounded-full transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button>
                        </div>
                        <div className="p-2">
                            <span className={`text-xs font-medium block mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Text Size</span>
                            <div className={`flex rounded-lg p-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <button onClick={() => setFontSize('sm')} className={`flex-1 flex items-center justify-center py-1 rounded-md text-[10px] transition-all ${fontSize === 'sm' ? (isDark ? 'bg-gray-600 text-blue-400' : 'bg-white text-blue-600 shadow-sm font-bold') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}`}>A-</button>
                                <button onClick={() => setFontSize('base')} className={`flex-1 flex items-center justify-center py-1 rounded-md text-xs transition-all ${fontSize === 'base' ? (isDark ? 'bg-gray-600 text-blue-400' : 'bg-white text-blue-600 shadow-sm font-bold') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}`}>A</button>
                                <button onClick={() => setFontSize('lg')} className={`flex-1 flex items-center justify-center py-1 rounded-md text-sm transition-all ${fontSize === 'lg' ? (isDark ? 'bg-gray-600 text-blue-400' : 'bg-white text-blue-600 shadow-sm font-bold') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}`}>A+</button>
                            </div>
                        </div>
                        <div className={`h-px my-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                        <button onClick={handleRestart} className={`flex items-center gap-2 p-2 text-xs font-medium rounded-lg w-full transition-colors ${isDark ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'}`}><RefreshCw size={14} /><span>Reset Settings</span></button>
                    </div>
                )}
            </div>
        </div>
      </div>
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 transition-colors scroll-smooth ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`} ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs border border-transparent ${msg.role === 'user' ? (isDark ? 'bg-gray-600' : 'bg-gray-400') : ''}`} style={msg.role === 'model' ? { backgroundColor: config.primaryColor } : {}}>{msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}</div>
            <div className={`max-w-[80%] p-3 rounded-2xl leading-relaxed shadow-sm transition-all duration-200 ${getMessageTextSize()} ${msg.role === 'user' ? (isDark ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-gray-100') + ' rounded-bl-none border' : 'text-white rounded-br-none chat-content'}`} style={msg.role === 'model' ? { backgroundColor: config.primaryColor } : {}}>{msg.role === 'model' ? (<div dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.text) }} />) : (msg.text)}</div>
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-2">
             <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs" style={{ backgroundColor: config.primaryColor }}><Bot size={14} /></div>
             <div className={`border p-3 rounded-2xl rounded-br-none shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}><div className="flex gap-1"><span className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} style={{ animationDelay: '0ms' }}></span><span className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} style={{ animationDelay: '150ms' }}></span><span className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} style={{ animationDelay: '300ms' }}></span></div></div>
          </div>
        )}
      </div>
      <div className={`border-t transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} ${isFullscreen ? '' : 'rounded-b-[1.4rem]'}`}>
        {config.suggestions && config.suggestions.length > 0 && messages.length <= 1 && (
           <div className="px-4 pt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar"><div className="flex gap-2">{config.suggestions.map((suggestion, idx) => (<button key={idx} onClick={() => handleSend(suggestion)} disabled={loading} className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-all border whitespace-nowrap flex items-center gap-1 group ${isDark ? 'bg-gray-800 hover:bg-blue-900/30 hover:text-blue-400 hover:border-blue-800 text-gray-300 border-gray-700' : 'bg-gray-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-gray-600 border-gray-200'}`}><Tag size={10} className={`group-hover:text-blue-400 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />{suggestion}</button>))}</div></div>
        )}
        <div className="p-4">
            <div className="relative flex items-center">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={config.chatInputPlaceholder || "Type your message..."} disabled={config.isActive === false} className={`w-full rounded-full py-3 pl-4 pr-12 text-sm focus:outline-none transition-all ${isDark ? 'bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-900/50 text-gray-100 disabled:bg-gray-800 placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 focus:border-blue-400 focus:ring-blue-100 text-gray-800 disabled:bg-gray-100 placeholder:text-gray-400'} border focus:ring-2`} />
            <button onClick={() => handleSend()} disabled={!input.trim() || loading || config.isActive === false} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/20" style={{ backgroundColor: config.primaryColor }}><Send size={16} className={loading ? 'opacity-0' : ''} />{loading && <Sparkles size={16} className="absolute top-2 left-2 animate-spin" />}</button>
            </div>
            <div className="text-center mt-2"><span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Powered by BotSleek.com</span></div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ChatPreview;
