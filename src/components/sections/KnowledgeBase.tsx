import React, { useState, useEffect, useMemo } from 'react';
import { Chatbot, DirectusFile, LLMJob, ProcessedFile, BuildStatus } from '../../types';
import { directus, getAssetUrl } from '../../services/directus';
import { uploadFiles, readFiles, readFolders, createItem, readItems, updateItem, createItems, deleteFile, deleteItem } from '@directus/sdk';
import { UploadCloud, FileText, CheckCircle2, Loader2, AlertCircle, FolderOpen, RefreshCw, Layers, PauseCircle, ArrowLeft, HardDrive, Search, ZapOff, Trash2, FileSpreadsheet, X, HelpCircle, ShoppingBag, Save } from 'lucide-react';
import FileDetails from './FileDetails';
import ConfirmationModal from '../ConfirmationModal';
import { useAuth } from '../../context/AuthContext';
import { syncProfileStats } from '../../services/chatbotService';

interface KnowledgeBaseProps {
  selectedChatbot: Chatbot | null;
  onUpdateChatbot: (id: number, data: Partial<Chatbot>) => Promise<void>;
}

const TEMPLATES = {
    faq: { label: 'FAQ Item', cols: ['Question', 'Answer', 'Link', 'Image'], fields: ['content_question', 'content_answer', 'content_link', 'content_image'] },
    product: { label: 'Product', cols: ['Name', 'SKU', 'Price', 'Details', 'Link', 'Image'], fields: ['content_product', 'content_sku', 'content_price', 'content_details', 'content_link', 'content_image'] }
};

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ selectedChatbot, onUpdateChatbot }) => {
  const { user, refreshUser } = useAuth();
  const [files, setFiles] = useState<DirectusFile[]>([]);
  const [llmJobs, setLlmJobs] = useState<LLMJob[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurging, setIsPurging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [buildingFileId, setBuildingFileId] = useState<string | null>(null);
  const [pausingFileId, setPausingFileId] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<ProcessedFile | null>(null);
  const [importingFile, setImportingFile] = useState<ProcessedFile | null>(null);
  const [importType, setImportType] = useState<'faq' | 'product'>('faq');
  const [importRows, setImportRows] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; message: React.ReactNode; onConfirm: () => void; confirmText?: string; confirmVariant?: 'danger' | 'primary'; } | null>(null);

  useEffect(() => {
    const resolveFolder = async () => {
      if (!selectedChatbot) { setFolderId(null); setFolderName(null); setFiles([]); setLlmJobs([]); setIsLoading(false); return; }
      setIsLoading(true); setError(null);
      if (selectedChatbot.chatbot_folder) { setFolderId(selectedChatbot.chatbot_folder); setFolderName(`llm/${selectedChatbot.chatbot_slug}`); setIsLoading(false); return; }
      if (!selectedChatbot.chatbot_slug) { setError("Invalid Bot ID (Slug)."); setIsLoading(false); return; }
      try {
        const llmFolders = await directus.request(readFolders({ filter: { name: { _eq: 'llm' } } }));
        const llmFolderId = llmFolders[0]?.id;
        if (!llmFolderId) { setError("Root 'llm' folder not found."); setIsLoading(false); return; }
        const botFolders = await directus.request(readFolders({ filter: { _and: [ { parent: { _eq: llmFolderId } }, { name: { _eq: selectedChatbot.chatbot_slug } } ] } }));
        if (botFolders && botFolders.length > 0) { setFolderId(botFolders[0].id); setFolderName(`llm/${botFolders[0].name}`); }
        else { setError(`Bot-specific folder (llm/${selectedChatbot.chatbot_slug}) not found.`); setFolderId(null); }
      } catch (err) { console.error(err); setError("Error identifying file storage."); } finally { setIsLoading(false); }
    };
    resolveFolder();
  }, [selectedChatbot?.chatbot_slug, selectedChatbot?.chatbot_folder, selectedChatbot?.id]);

  useEffect(() => { if (folderId && selectedChatbot?.id) loadFilesAndJobs(folderId, selectedChatbot.id); }, [folderId, selectedChatbot?.id]);

  useEffect(() => {
    if (!selectedChatbot) return;
    const pollJobs = async () => {
      try {
        const result = await directus.request(readItems('llm', { fields: ['*', { llm_file: ['id'] }], filter: { llm_chatbot: { _eq: selectedChatbot.id } } }));
        setLlmJobs(result as unknown as LLMJob[]);
      } catch (err) {}
    };
    const intervalId = setInterval(pollJobs, 5000); 
    return () => clearInterval(intervalId);
  }, [selectedChatbot?.id]);

  const loadFilesAndJobs = async (targetFolderId: string, botId: number) => {
    setIsLoading(true);
    try {
      const [filesResult, jobsResult] = await Promise.all([
        directus.request(readFiles({ fields: ['id', 'filename_download', 'filesize', 'uploaded_on', 'type'], filter: { folder: { _eq: targetFolderId } }, sort: ['-uploaded_on'] })),
        directus.request(readItems('llm', { fields: ['*', { llm_file: ['id'] }], filter: { llm_chatbot: { _eq: botId } } }))
      ]);
      const fetchedFiles = filesResult as DirectusFile[];
      setFiles(fetchedFiles);
      setLlmJobs(jobsResult as unknown as LLMJob[]);
      const currentTotalBytes = fetchedFiles.reduce((acc, f) => acc + (Number(f.filesize) || 0), 0);
      const currentTotalMB = Math.ceil(currentTotalBytes / (1024 * 1024));
      if (selectedChatbot && (selectedChatbot.chatbot_llm !== fetchedFiles.length || Number(selectedChatbot.chatbot_storage || 0) !== currentTotalMB)) {
          await onUpdateChatbot(selectedChatbot.id, { chatbot_llm: fetchedFiles.length, chatbot_storage: currentTotalMB });
          if (user?.id) { await syncProfileStats(user.id); await refreshUser(); }
      }
    } catch (err) { setError("Failed to load files and build jobs."); } finally { setIsLoading(false); }
  };

  const processedFiles: ProcessedFile[] = useMemo(() => files.map(file => {
      const job = llmJobs.find(j => (j.llm_file as any)?.id === file.id || j.llm_file === file.id);
      return { id: file.id, name: file.filename_download, size: Number(file.filesize), uploadDate: new Date(file.uploaded_on).toLocaleDateString('en-US'), type: file.type, buildStatus: (job?.llm_status as BuildStatus) || 'idle', errorMessage: job?.llm_error, llmJobId: job?.id };
  }), [files, llmJobs]);

  const stats = useMemo(() => ({ total: processedFiles.length, ready: processedFiles.filter(f => f.buildStatus === 'ready').length, processing: processedFiles.filter(f => f.buildStatus === 'start' || f.buildStatus === 'building').length, completed: processedFiles.filter(f => f.buildStatus === 'completed').length, error: processedFiles.filter(f => f.buildStatus === 'error').length, idle: processedFiles.filter(f => f.buildStatus === 'idle').length }), [processedFiles]);
  const formatSize = (bytes: number) => { if (bytes === 0) return '0 B'; const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; };

  const handleBuild = async (fileId: string, llmJobId?: number) => {
    if (!llmJobId) return;
    setBuildingFileId(fileId);
    try {
      // @ts-ignore
      await directus.request(updateItem('llm', llmJobId, { llm_status: 'start' }));
    } catch (err) {
      setError("Failed to start build job.");
    } finally {
      setBuildingFileId(null);
    }
  };

  const handlePause = async (file: ProcessedFile) => {
    if (!file.llmJobId) return;
    setPausingFileId(file.id);
    try {
      // @ts-ignore
      await directus.request(updateItem('llm', file.llmJobId, { llm_status: 'ready' }));
    } catch (err) {
      setError("Failed to pause build job.");
    } finally {
      setPausingFileId(null);
    }
  };

  const handleDeleteFile = async (file: ProcessedFile) => {
    try {
      if (file.llmJobId) {
        // @ts-ignore
        await directus.request(deleteItem('llm', file.llmJobId));
      }
      await directus.request(deleteFile(file.id));
      setFiles(prev => prev.filter(f => f.id !== file.id));
      setLlmJobs(prev => prev.filter(j => j.id !== file.llmJobId));
      setViewingFile(null);
    } catch (err) {
      setError("Failed to delete file.");
    }
  };

  const handlePurgeMemory = async () => {
    if (!selectedChatbot) return;
    setIsPurging(true);
    try {
      const jobsToDelete = llmJobs.map(j => j.id);
      for (const id of jobsToDelete) {
          // @ts-ignore
          await directus.request(deleteItem('llm', id));
      }
      const filesToDelete = files.map(f => f.id);
      for (const id of filesToDelete) {
          await directus.request(deleteFile(id));
      }
      setFiles([]);
      setLlmJobs([]);
      setModalState(null);
    } catch (err) {
      setError("Failed to purge memory.");
    } finally {
      setIsPurging(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!folderId || !selectedChatbot) return;
    const optimisticFileId = `uploading-${Date.now()}`;
    setFiles(prev => [{ id: optimisticFileId, filename_download: file.name, filesize: String(file.size), uploaded_on: new Date().toISOString(), type: file.type }, ...prev]);
    try {
      const formData = new FormData();
      formData.append('title', file.name); formData.append('folder', folderId); formData.append('file', file);
      const uploadedFile = await directus.request(uploadFiles(formData)) as unknown as DirectusFile;
      const newJob = await directus.request(createItem('llm', { llm_chatbot: selectedChatbot.id, llm_file: uploadedFile.id, llm_status: 'ready' })) as unknown as LLMJob;
      setLlmJobs(prev => [newJob, ...prev]);
      setFiles(prev => [uploadedFile, ...prev.filter(f => f.id !== optimisticFileId)]);
    } catch (err) { setError("File upload failed."); setFiles(prev => prev.filter(f => f.id !== optimisticFileId)); }
  };

  const StatusAndActionButton: React.FC<{ file: ProcessedFile }> = ({ file }) => {
    const isBuildingThis = buildingFileId === file.id;
    const isCSV = file.name.toLowerCase().endsWith('.csv');
    const isImported = isCSV && file.buildStatus === 'completed';
    if (file.buildStatus === 'ready' || file.buildStatus === 'idle') return <div className="flex gap-2">{isCSV ? <button onClick={(e) => { e.stopPropagation(); setImportingFile(file); }} className="flex items-center gap-2 px-4 py-1.5 font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-md active:scale-95"><FileSpreadsheet size={16} /> Import Content</button> : <button onClick={(e) => { e.stopPropagation(); handleBuild(file.id, file.llmJobId); }} disabled={isBuildingThis} className="flex items-center gap-2 px-4 py-1.5 font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md active:scale-95">{isBuildingThis ? <Loader2 size={16} className="animate-spin" /> : <Layers size={16} />} Build</button>}</div>;
    if (file.buildStatus === 'start') return <div className="flex items-center gap-2 text-xs text-cyan-600 bg-cyan-50 px-2.5 py-1.5 rounded-full font-medium"><Loader2 size={14} className="animate-spin" /> Queued...</div>;
    if (file.buildStatus === 'building') return <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 px-2.5 py-1.5 rounded-full font-medium"><Loader2 size={14} className="animate-spin" /> Processing...</div>;
    if (file.buildStatus === 'completed') return <div className="flex items-center gap-4">{isCSV && <button onClick={(e) => { e.stopPropagation(); setImportingFile(file); }} className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50"><FileSpreadsheet size={14} /> Update Content</button>}<span className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-medium ${isImported ? 'text-emerald-700 bg-emerald-100' : 'text-green-600 bg-green-50'}`}><CheckCircle2 size={14} /> {isImported ? 'Imported' : 'Ready'}</span></div>;
    if (file.buildStatus === 'error') return <div className="flex items-center gap-2"><span className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-full font-medium"><AlertCircle size={14} /> Error</span></div>;
    return null;
  };

  const renderContent = () => {
    if (viewingFile) return <FileDetails file={viewingFile} onBack={() => setViewingFile(null)} onBuild={handleBuild} onPause={handlePause} onDelete={handleDeleteFile} isBuilding={buildingFileId === viewingFile.id} isPausing={pausingFileId === viewingFile.id} />;
    if (!selectedChatbot) return <div className="flex flex-col items-center justify-center h-64 text-gray-400"><AlertCircle size={48} className="mb-4 opacity-20" /><p>Please select a chatbot first.</p></div>;
    return (
        <div className="space-y-8 animate-fade-in text-left" dir="ltr">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Upload your knowledge files and process (Build) them for AI indexing.</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {folderName && <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg"><FolderOpen size={14} /> Target: {folderName}</div>}
                {files.length > 0 && <div className="flex items-center gap-2 text-xs font-mono text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg"><HardDrive size={14} /> Total Size: {formatSize(files.reduce((acc, f) => acc + Number(f.filesize), 0))}</div>}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <FileText size={18} className="text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Total Files</span>
                    <span className="block font-bold text-gray-900 dark:text-white">{stats.total}</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Layers size={18} />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Ready</span>
                    <span className="block font-bold text-gray-900 dark:text-white">{stats.ready + stats.idle}</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                    <Loader2 size={18} className={stats.processing > 0 ? "animate-spin" : ""} />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Building</span>
                    <span className="block font-bold text-gray-900 dark:text-white">{stats.processing}</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Completed</span>
                    <span className="block font-bold text-gray-900 dark:text-white">{stats.completed}</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Failed</span>
                    <span className="block font-bold text-gray-900 dark:text-white">{stats.error}</span>
                  </div>
                </div>
            </div>
            <div className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'} ${!folderId ? 'opacity-50 pointer-events-none' : ''}`} onDragEnter={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={e => { e.preventDefault(); setDragActive(false); }} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]); }} onClick={() => folderId && document.getElementById('file-upload')?.click()}>
              <input id="file-upload" type="file" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} accept=".pdf,.docx,.txt,.md,.csv" />
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4"><UploadCloud size={32} /></div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">Drop files here or click to upload</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{folderId ? 'Uploading directly to bot-specific storage' : 'Identifying target folder...'}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2"><FileText size={18} />Existing Files</h3>
                <div className="relative">
                  <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"/>
                  <input type="text" placeholder="Search files..." className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:border-blue-300 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? <div className="p-8 flex justify-center items-center gap-2 text-gray-400 dark:text-gray-500"><Loader2 className="animate-spin" size={18} /> Loading...</div> : processedFiles.length === 0 ? <div className="p-8 text-center text-gray-400 dark:text-gray-500">No files found in storage.</div> : processedFiles.map(file => (<div key={file.id} onClick={() => setViewingFile(file)} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"><div className="flex items-center gap-4 flex-1 min-w-0"><div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0"><FileText size={20} /></div><div className="min-w-0 text-left"><p className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">{file.name}</p><div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1"><span>{formatSize(file.size)}</span><span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span><span>{file.uploadDate}</span></div></div></div><div className="flex items-center gap-4 w-full sm:w-auto justify-end"><StatusAndActionButton file={file} /><button onClick={e => { e.stopPropagation(); setViewingFile(file); }} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><ArrowLeft size={18} className="rotate-180" /></button></div></div>))}
              </div>
            </div>
            <div className="mt-12 pt-8 border-t-2 border-dashed border-red-100 dark:border-red-900/30">
                <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6"><div className="flex flex-col md:flex-row items-center justify-between gap-6"><div className="flex items-start gap-4"><div className="p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl"><ZapOff size={24} /></div><div className="text-left"><h4 className="text-lg font-bold text-red-700 dark:text-red-400">Purge Bot Memory</h4><p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1 leading-relaxed">Permanently delete all indexed knowledge, vectors, and files for this bot.</p></div></div><button onClick={() => setModalState({ isOpen: true, title: "Purge Bot Memory", confirmText: "Purge & Delete", confirmVariant: "danger", message: "This will permanently remove all vectors from Qdrant and reset the knowledge base status. Proceed?", onConfirm: handlePurgeMemory })} disabled={isPurging} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-900 text-red-600 dark:text-red-500 border-2 border-red-200 dark:border-red-900/50 rounded-xl font-bold hover:bg-red-600 hover:text-white dark:hover:bg-red-600 transition-all shadow-sm disabled:opacity-50">{isPurging ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />} {isPurging ? 'Purging...' : 'Start Purge'}</button></div></div>
            </div>
        </div>
    );
  };
  return (<>{renderContent()}{modalState && <ConfirmationModal {...modalState} onClose={() => setModalState(null)} />}</>);
};
export default KnowledgeBase;