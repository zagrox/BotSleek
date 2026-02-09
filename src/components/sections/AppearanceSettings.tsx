
import React, { useState, useEffect, useRef } from 'react';
import { Chatbot } from '../../types';
import { Save, Upload, Loader2, Check, AlertCircle, Plus, X } from 'lucide-react';
import { directus, getAssetUrl } from '../../services/directus';
import { uploadFiles, deleteFile } from '@directus/sdk';
import { HexColorPicker } from 'react-colorful';

interface Props {
  selectedChatbot: Chatbot | null;
  onUpdateChatbot: (id: number, data: Partial<Chatbot>) => Promise<void>;
  onPreviewUpdate?: (data: Partial<Chatbot>) => void;
}

const AVATAR_FOLDER_ID = "3469b6ba-b2e0-40de-b58d-5da0385c404d";

const AppearanceSettings: React.FC<Props> = ({ selectedChatbot, onUpdateChatbot, onPreviewUpdate }) => {
  const [formData, setFormData] = useState<Partial<Chatbot>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [suggestionInput, setSuggestionInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedChatbot) {
      setFormData({
        chatbot_welcome: selectedChatbot.chatbot_welcome || '',
        chatbot_logo: selectedChatbot.chatbot_logo,
        chatbot_color: selectedChatbot.chatbot_color || '#3b82f6',
        chatbot_input: selectedChatbot.chatbot_input || '',
        chatbot_suggestion: selectedChatbot.chatbot_suggestion || [],
      });
    }
  }, [selectedChatbot]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (!selectedChatbot) return;
    setLoading(true);
    setSuccess(false);
    try {
      await onUpdateChatbot(selectedChatbot.id, formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedChatbot) return;
    setUploading(true);
    try {
      const oldLogoId = formData.chatbot_logo;
      if (oldLogoId) {
        try { await directus.request(deleteFile(oldLogoId)); } catch (delError) {}
      }
      const file = e.target.files[0];
      const form = new FormData();
      form.append('file', file);
      form.append('folder', AVATAR_FOLDER_ID);
      const result = await directus.request(uploadFiles(form));
      // @ts-ignore
      const fileId = result.id;
      setFormData(prev => ({ ...prev, chatbot_logo: fileId }));
      onPreviewUpdate?.({ chatbot_logo: fileId });
    } catch (error) {
      console.error(error);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const addSuggestion = () => {
    const currentSuggestions = formData.chatbot_suggestion || [];
    if (currentSuggestions.length >= 3) return;
    const text = suggestionInput.trim();
    if (!text) return;
    const newSuggestions = [...currentSuggestions, text];
    setFormData(prev => ({ ...prev, chatbot_suggestion: newSuggestions }));
    onPreviewUpdate?.({ chatbot_suggestion: newSuggestions });
    setSuggestionInput('');
  };

  const removeSuggestion = (index: number) => {
    const currentSuggestions = formData.chatbot_suggestion || [];
    const newSuggestions = currentSuggestions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, chatbot_suggestion: newSuggestions }));
    onPreviewUpdate?.({ chatbot_suggestion: newSuggestions });
  };

  if (!selectedChatbot) return <div className="flex flex-col items-center justify-center h-64 text-gray-400"><AlertCircle size={48} className="mb-4 opacity-20" /><p>Please select a chatbot first.</p></div>;

  return (
    <div className="space-y-8 animate-fade-in text-left" dir="ltr">
      <div><p className="text-gray-500 dark:text-gray-400 text-lg">Customize the look and feel of your chatbot.</p></div>
      <div className="space-y-8">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand Color</label>
          <div className="flex items-start gap-4 relative" ref={colorPickerRef}>
             <button type="button" onClick={() => setShowColorPicker(!showColorPicker)} className="w-12 h-12 rounded-xl shadow-sm border border-gray-200 flex-shrink-0 transition-transform hover:scale-105" style={{ backgroundColor: formData.chatbot_color || '#3b82f6' }} title="Change Color"></button>
             <div className="space-y-2">
                 <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm pointer-events-none">#</span>
                    <input type="text" value={(formData.chatbot_color || '').substring(1)} onChange={(e) => { const val = e.target.value.replace(/[^0-9a-fA-F]/g, ''); const newColor = '#' + val; setFormData(prev => ({ ...prev, chatbot_color: newColor })); if (val.length === 6 || val.length === 3) onPreviewUpdate?.({ chatbot_color: newColor }); }} maxLength={6} className="w-full pl-7 pr-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-100 outline-none font-mono text-sm" />
                 </div>
                 <p className="text-xs text-gray-500">Used for chat headers, buttons, and user message bubbles.</p>
             </div>
             {showColorPicker && (<div className="absolute top-14 left-0 z-20 p-3 border border-gray-200 rounded-xl bg-white shadow-xl animate-fade-in"><HexColorPicker color={formData.chatbot_color || '#3b82f6'} onChange={(color) => { setFormData(prev => ({ ...prev, chatbot_color: color })); onPreviewUpdate?.({ chatbot_color: color }); }} /></div>)}
          </div>
        </div>
        <div className="grid gap-2">
             <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">Bot Avatar</label>
             <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-800">
                 <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 overflow-hidden relative flex-shrink-0">
                    {uploading ? <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={20} /></div> : <img src={formData.chatbot_logo ? getAssetUrl(formData.chatbot_logo) : 'https://via.placeholder.com/150'} alt="Avatar" className="w-full h-full object-cover" />}
                 </div>
                 <div className="flex-1">
                    <button onClick={() => document.getElementById('avatar-upload')?.click()} className="text-sm text-blue-600 font-medium flex items-center gap-2 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors w-full justify-center border border-blue-200 border-dashed" disabled={uploading}>
                        <Upload size={16} />{uploading ? 'Uploading...' : 'Upload New Avatar'}
                    </button>
                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                 </div>
             </div>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Welcome Message</label>
          <input type="text" value={formData.chatbot_welcome || ''} onChange={(e) => { const val = e.target.value; setFormData(prev => ({ ...prev, chatbot_welcome: val })); onPreviewUpdate?.({ chatbot_welcome: val }); }} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
        </div>
        <div className="grid gap-2">
            <div className="flex justify-between items-center"><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Suggested Questions (Max 3)</label><span className="text-xs text-gray-400">{(formData.chatbot_suggestion || []).length}/3</span></div>
            <div className="relative">
                <input type="text" value={suggestionInput} onChange={(e) => setSuggestionInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSuggestion())} disabled={(formData.chatbot_suggestion || []).length >= 3} placeholder={(formData.chatbot_suggestion || []).length >= 3 ? "Limit reached" : "Type a question and press enter..."} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" />
                <button onClick={addSuggestion} disabled={(formData.chatbot_suggestion || []).length >= 3 || !suggestionInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-0 transition-all"><Plus size={16} /></button>
            </div>
            {(formData.chatbot_suggestion || []).length > 0 && (<div className="flex flex-wrap gap-2 mt-2">{(formData.chatbot_suggestion || []).map((suggestion, index) => (<div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm border border-gray-200"><span>{suggestion}</span><button onClick={() => removeSuggestion(index)} className="p-0.5 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors"><X size={14} /></button></div>))}</div>)}
             <p className="text-xs text-gray-400">These options appear as quick-reply buttons above the input box.</p>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Input Placeholder</label>
          <input type="text" value={formData.chatbot_input || ''} onChange={(e) => { const val = e.target.value; setFormData(prev => ({ ...prev, chatbot_input: val })); onPreviewUpdate?.({ chatbot_input: val }); }} placeholder="e.g. Type your message..." className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
        </div>
        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
             <button onClick={handleSave} disabled={loading} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-70 ${success ? 'bg-green-600 text-white' : 'bg-gray-900 dark:bg-blue-600 text-white hover:bg-gray-800'}`}>
                 {loading ? <Loader2 size={18} className="animate-spin" /> : success ? <Check size={18} /> : <Save size={18} />}{success ? 'Saved' : 'Save Appearance'}
             </button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
