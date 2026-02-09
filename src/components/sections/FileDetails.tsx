
import React from 'react';
import { ArrowLeft, FileText, Layers, CheckCircle2, Loader2, AlertCircle, Clock, RefreshCw, PauseCircle, Trash2 } from 'lucide-react';
import { ProcessedFile, BuildStatus } from '../../types';

interface FileDetailsProps {
  file: ProcessedFile;
  onBack: () => void;
  onBuild: (fileId: string, llmJobId?: number) => void;
  onPause: (file: ProcessedFile) => void;
  onDelete: (file: ProcessedFile) => void;
  isBuilding: boolean;
  isPausing: boolean;
}

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const StatusBadge: React.FC<{ status: BuildStatus, error?: string | null }> = ({ status, error }) => {
    switch (status) {
        case 'ready':
            return <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full font-medium"><Layers size={14} /><span>Ready to Process</span></div>;
        case 'start':
            return <div className="flex items-center gap-2 text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 px-2.5 py-1 rounded-full font-medium"><Loader2 size={14} className="animate-spin" /><span>In Queue</span></div>;
        case 'building':
            return <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-1 rounded-full font-medium"><Loader2 size={14} className="animate-spin" /><span>Processing...</span></div>;
        case 'completed':
            return <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full font-medium"><CheckCircle2 size={14} /><span>Processed</span></div>;
        case 'error':
            return (
                <div className="group relative">
                    <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full font-medium cursor-pointer"><AlertCircle size={14} /><span>Processing Error</span></div>
                    {error && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{error}</div>}
                </div>
            );
        case 'idle':
        default:
            return <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full font-medium"><Clock size={14} /><span>Not Processed</span></div>;
    }
};

const FileDetails: React.FC<FileDetailsProps> = ({ file, onBack, onBuild, onPause, onDelete, isBuilding, isPausing }) => {
    const isCSV = file.name.toLowerCase().endsWith('.csv');

    const ActionButton: React.FC = () => {
        if (isPausing) {
            return (
                <div className="flex items-center gap-2 px-4 py-2 text-gray-500">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Stopping...</span>
                </div>
            );
        }
    
        switch (file.buildStatus) {
            case 'start':
            case 'building':
                return (
                    <button
                        onClick={() => onPause(file)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 font-medium transition-colors"
                    >
                        <PauseCircle size={18} />
                        <span>Stop Processing</span>
                    </button>
                );
            
            case 'completed':
                return (
                    <button
                        onClick={() => onDelete(file)}
                        className="flex items-center gap-2 px-5 py-2.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 font-medium transition-colors"
                    >
                        <Trash2 size={18} />
                        <span>Delete File</span>
                    </button>
                );

            case 'error':
                 return (
                    <div className="flex items-center gap-3">
                        {!isCSV && (
                            <button
                                onClick={() => onBuild(file.id, file.llmJobId)}
                                disabled={isBuilding}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-60"
                            >
                                {isBuilding ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                <span>{isBuilding ? 'Retrying...' : 'Reprocess'}</span>
                            </button>
                        )}
                        <button
                            onClick={() => onDelete(file)}
                            className="flex items-center gap-2 px-5 py-2.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 font-medium transition-colors"
                        >
                            <Trash2 size={18} />
                            <span>Delete File</span>
                        </button>
                    </div>
                );

            case 'ready':
            case 'idle':
            default:
                return (
                    <div className="flex items-center gap-3">
                        {!isCSV && (
                            <button
                                onClick={() => onBuild(file.id, file.llmJobId)}
                                disabled={isBuilding}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-60"
                            >
                                {isBuilding ? <Loader2 size={18} className="animate-spin" /> : <Layers size={18} />}
                                <span>{isBuilding ? 'Sending...' : 'Process File'}</span>
                            </button>
                        )}
                        <button
                            onClick={() => onDelete(file)}
                            className="flex items-center gap-2 px-5 py-2.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 font-medium transition-colors"
                        >
                            <Trash2 size={18} />
                            <span>Delete File</span>
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-left" dir="ltr">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">File Details</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">File info and processing status</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                        <FileText size={32} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white break-words">{file.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">File Type: {file.type}</p>
                    </div>
                </div>

                <dl className="space-y-4 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                        <dt className="text-gray-500 dark:text-gray-400 font-medium">Processing Status</dt>
                        <dd><StatusBadge status={file.buildStatus} error={file.errorMessage} /></dd>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                        <dt className="text-gray-500 dark:text-gray-400 font-medium">File Size</dt>
                        <dd className="font-mono text-gray-700 dark:text-gray-300">{formatSize(file.size)}</dd>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <dt className="text-gray-500 dark:text-gray-400 font-medium">Upload Date</dt>
                        <dd className="font-mono text-gray-700 dark:text-gray-300">{file.uploadDate}</dd>
                    </div>
                </dl>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <h4 className="font-semibold text-gray-800 dark:text-white">File Actions</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">
                    Perform the desired actions on this file.
                </p>
                <ActionButton />
            </div>

            {isCSV && (
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="text-emerald-600 dark:text-emerald-400 mt-0.5" size={18} />
                        <div>
                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Data file detected</p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400/80 leading-relaxed mt-1">
                                This file is in CSV format. CSV files should be imported directly into the "Content Manager" section instead of being processed as documents. 
                                Use the "Import Content" button in the file list for this.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileDetails;
