
import React, { useState, useEffect, useRef } from 'react';
import { Chatbot } from '../../types';
import { Save, AlertCircle, Loader2, Check, Sparkles, ChevronDown, ChevronUp, Phone, Instagram, Send, MessageCircle, MapPin, X } from 'lucide-react';
import { PROMPT_TEMPLATE } from '../../constants';

interface Props {
  selectedChatbot: Chatbot | null;
  onUpdateChatbot: (id: number, data: Partial<Chatbot>) => Promise<void>;
  onPreviewUpdate?: (data: Partial<Chatbot>) => void;
}

const LocationPicker: React.FC<{ 
    initialPosition?: [number, number]; 
    onSave: (coords: [number, number]) => void; 
    onCancel: () => void 
}> = ({ initialPosition, onSave, onCancel }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [currentCoords, setCurrentCoords] = useState<[number, number]>(initialPosition || [51.3890, 35.6892]); 
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current) return;
        const L = (window as any).L;
        if (!L) {
            console.error("Leaflet not loaded");
            return;
        }

        const [lng, lat] = currentCoords;
        mapInstance.current = L.map(mapRef.current).setView([lat, lng], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance.current);

        markerInstance.current = L.marker([lat, lng], { draggable: true }).addTo(mapInstance.current);

        markerInstance.current.on('dragend', function(event: any) {
            const position = markerInstance.current.getLatLng();
            setCurrentCoords([position.lng, position.lat]);
        });

        mapInstance.current.on('click', function(e: any) {
            markerInstance.current.setLatLng(e.latlng);
            setCurrentCoords([e.latlng.lng, e.latlng.lat]);
        });

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    const handleConfirm = () => {
        onSave(currentCoords);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 relative z-0" ref={mapRef}></div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-end gap-3">
                <button 
                    onClick={onCancel}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleConfirm}
                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium shadow-md shadow-blue-600/20"
                >
                    Confirm Location
                </button>
            </div>
        </div>
    );
};

const GeneralSettings: React.FC<Props> = ({ selectedChatbot, onUpdateChatbot, onPreviewUpdate }) => {
  const [formData, setFormData] = useState<Partial<Chatbot>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
    if (selectedChatbot) {
      setFormData({
        chatbot_name: selectedChatbot.chatbot_name || '',
        chabot_title: selectedChatbot.chabot_title || '',
        chatbot_business: selectedChatbot.chatbot_business || '',
        chatbot_prompt: selectedChatbot.chatbot_prompt || '',
        chatbot_active: selectedChatbot.chatbot_active ?? true,
        chatbot_human: selectedChatbot.chatbot_human || '',
        chatbot_phone: selectedChatbot.chatbot_phone || '',
        chatbot_instagram: selectedChatbot.chatbot_instagram || '',
        chatbot_whatsapp: selectedChatbot.chatbot_whatsapp || '',
        chatbot_telegram: selectedChatbot.chatbot_telegram || '',
        chatbot_address: selectedChatbot.chatbot_address || '',
        chatbot_location: selectedChatbot.chatbot_location,
      });
    }
  }, [selectedChatbot]);

  const handleSave = async () => {
    if (!selectedChatbot) return;
    setLoading(true);
    setSuccess(false);
    try {
      await onUpdateChatbot(selectedChatbot.id, formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = () => {
    const businessName = formData.chatbot_business || 'this business';
    const filledTemplate = PROMPT_TEMPLATE.replace(/{{chatbot_business}}/g, businessName);
    setFormData(prev => ({ ...prev, chatbot_prompt: filledTemplate }));
    onPreviewUpdate?.({ chatbot_prompt: filledTemplate });
  };

  const cleanSocialInput = (value: string, type: 'instagram' | 'telegram' | 'whatsapp') => {
    let cleaned = value.trim();
    if (type === 'instagram') {
        cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, '').replace('@', '').split('?')[0];
    } else if (type === 'telegram') {
        cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?t\.me\//, '').replace(/^(https?:\/\/)?(www\.)?telegram\.me\//, '').replace('@', '');
    } else if (type === 'whatsapp') {
        cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?wa\.me\//, '').replace(/^(https?:\/\/)?(www\.)?api\.whatsapp\.com\/send\?phone=/, '');
    }
    return cleaned.replace(/\/$/, '');
  };

  if (!selectedChatbot) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <AlertCircle size={48} className="mb-4 opacity-20" />
        <p>Please select a chatbot first.</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-8 animate-fade-in">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Configure your chatbot's basic information and identity.</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bot Status</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
               {formData.chatbot_active ? 'Chatbot is active and responding to users.' : 'Chatbot is offline.'}
            </p>
          </div>
          <button
            onClick={() => {
                const newVal = !formData.chatbot_active;
                setFormData(prev => ({ ...prev, chatbot_active: newVal }));
                onPreviewUpdate?.({ chatbot_active: newVal });
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                formData.chatbot_active ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
                className={`${
                    formData.chatbot_active ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out`}
            />
          </button>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bot Name</label>
          <input
            type="text"
            value={formData.chatbot_name || ''}
            onChange={(e) => {
              const newName = e.target.value;
              const currentName = formData.chatbot_name || '';
              const currentTitle = formData.chabot_title || '';
              const prefix = 'AI Assistant ';
              const newFormState: Partial<Chatbot> = { ...formData, chatbot_name: newName };
              const previewUpdateState: Partial<Chatbot> = { chatbot_name: newName };
              const isAutoGeneratedOrEmpty = currentTitle === '' || currentTitle === currentName || currentTitle === `${prefix}${currentName}`;
              if (isAutoGeneratedOrEmpty) {
                const newTitle = newName ? `${prefix}${newName}` : '';
                newFormState.chabot_title = newTitle;
                previewUpdateState.chabot_title = newTitle;
              }
              setFormData(newFormState);
              onPreviewUpdate?.(previewUpdateState);
            }}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Short Description</label>
          <textarea
            value={formData.chabot_title || ''}
            onChange={(e) => {
              const val = e.target.value;
              setFormData(prev => ({ ...prev, chabot_title: val }));
              onPreviewUpdate?.({ chabot_title: val });
            }}
            rows={2}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all resize-none"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Business Name</label>
          <input
            type="text"
            value={formData.chatbot_business || ''}
            onChange={(e) => {
              const val = e.target.value;
              setFormData(prev => ({ ...prev, chatbot_business: val }));
            }}
            placeholder="e.g. Persia Trading Co."
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all"
          />
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            This name helps the bot understand its context and is used in prompt templates.
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
             <h3 className="text-sm font-bold text-gray-800 dark:text-white">Contact Info (Optional)</h3>
             <p className="text-xs text-gray-500 dark:text-gray-400">
                 This info is shown in the bot menu for quick user access.
             </p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Phone size={14} className="text-gray-400"/>
                        Phone Number
                    </label>
                    <input
                        type="text"
                        value={formData.chatbot_phone || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({ ...prev, chatbot_phone: val }));
                            onPreviewUpdate?.({ chatbot_phone: val });
                        }}
                        placeholder="+1 234 567 890"
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Instagram size={14} className="text-gray-400"/>
                        Instagram
                    </label>
                    <div className="flex items-stretch rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900 focus-within:border-blue-500 transition-all">
                        <span className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-700 flex items-center select-none">
                            @
                        </span>
                        <input
                            type="text"
                            value={formData.chatbot_instagram || ''}
                            onChange={(e) => {
                                const val = cleanSocialInput(e.target.value, 'instagram');
                                setFormData(prev => ({ ...prev, chatbot_instagram: val }));
                                onPreviewUpdate?.({ chatbot_instagram: val });
                            }}
                            placeholder="username"
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <MessageCircle size={14} className="text-gray-400"/>
                        WhatsApp
                    </label>
                    <div className="flex items-stretch rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900 focus-within:border-blue-500 transition-all">
                        <span className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-700 flex items-center select-none whitespace-nowrap">
                            wa.me/
                        </span>
                        <input
                            type="text"
                            value={formData.chatbot_whatsapp || ''}
                            onChange={(e) => {
                                const val = cleanSocialInput(e.target.value, 'whatsapp');
                                setFormData(prev => ({ ...prev, chatbot_whatsapp: val }));
                                onPreviewUpdate?.({ chatbot_whatsapp: val });
                            }}
                            placeholder="12345678"
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                        />
                    </div>
                </div>

                 <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Send size={14} className="text-gray-400"/>
                        Telegram
                    </label>
                    <div className="flex items-stretch rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900 focus-within:border-blue-500 transition-all">
                        <span className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-700 flex items-center select-none">
                            t.me/
                        </span>
                        <input
                            type="text"
                            value={formData.chatbot_telegram || ''}
                            onChange={(e) => {
                                const val = cleanSocialInput(e.target.value, 'telegram');
                                setFormData(prev => ({ ...prev, chatbot_telegram: val }));
                                onPreviewUpdate?.({ chatbot_telegram: val });
                            }}
                            placeholder="username"
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                        />
                    </div>
                </div>

                <div className="md:col-span-2 grid gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400"/>
                        Address
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={formData.chatbot_address || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                setFormData(prev => ({ ...prev, chatbot_address: val }));
                            }}
                            placeholder="Enter your postal address..."
                            className="w-full pr-20 pl-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all"
                        />
                        <button
                            onClick={() => setIsMapOpen(true)}
                            className="absolute right-1 top-1 bottom-1 px-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                        >
                            <MapPin size={14} />
                            Map
                        </button>
                    </div>
                </div>
             </div>
        </div>

        <div className="pt-2">
            <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span>Advanced Bot Settings</span>
            </button>
        </div>

        {showAdvanced && (
            <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-800 animate-fade-in">
                <div className="grid gap-2 relative">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">System Instruction (Prompt)</label>
                    <button
                    onClick={loadTemplate}
                    className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                    <Sparkles size={14} />
                    Use Suggested Template
                    </button>
                </div>

                <textarea
                    value={formData.chatbot_prompt || ''}
                    onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, chatbot_prompt: val }));
                    onPreviewUpdate?.({ chatbot_prompt: val });
                    }}
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all font-mono text-sm leading-relaxed"
                />
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    This instruction determines the personality and behavior of the bot.
                </p>
                </div>

                <div className="grid gap-2 relative">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Human Operator Message</label>
                </div>
                <textarea
                    value={formData.chatbot_human || ''}
                    onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, chatbot_human: val }));
                    }}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all font-mono text-sm leading-relaxed"
                />
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Shown when the user requests to talk to a human agent.
                </p>
                </div>
            </div>
        )}
        
        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
             <button 
               onClick={handleSave}
               disabled={loading}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-gray-900/20 dark:shadow-blue-600/20 active:scale-95 disabled:opacity-70
                 ${success ? 'bg-green-600 text-white' : 'bg-gray-900 dark:bg-blue-600 text-white hover:bg-gray-800 dark:hover:bg-blue-700'}`}
             >
                 {loading ? (
                   <Loader2 size={18} className="animate-spin" />
                 ) : success ? (
                   <Check size={18} />
                 ) : (
                   <Save size={18} />
                 )}
                 {success ? 'Saved' : 'Save Changes'}
             </button>
        </div>
      </div>
    </div>
    
    {isMapOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsMapOpen(false)}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px] max-h-full" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <MapPin size={20} className="text-blue-600 dark:text-blue-400"/>
                        Select Location on Map
                    </h3>
                    <button onClick={() => setIsMapOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 relative bg-gray-100">
                    <LocationPicker
                        initialPosition={formData.chatbot_location?.coordinates}
                        onSave={(coords) => {
                            setFormData(prev => ({ ...prev, chatbot_location: { type: 'Point', coordinates: coords } }));
                            setIsMapOpen(false);
                        }}
                        onCancel={() => setIsMapOpen(false)}
                    />
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default GeneralSettings;
