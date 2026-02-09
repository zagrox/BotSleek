
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm & Execute',
  confirmVariant = 'danger',
}) => {
  if (!isOpen) return null;

  // Prevents scroll on the body when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const confirmButtonClasses = {
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20',
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fade-in" 
      style={{ animationDuration: '0.2s' }} 
      onClick={onClose}
      dir="ltr"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-800 transform transition-transform scale-95 animate-fade-in"
        style={{ animationDuration: '0.3s', animationDelay: '0.05s' }}
      >
        <div className="p-6">
          <div className="flex items-start gap-4 text-left">
            <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${
              confirmVariant === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500'
            }`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {message}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-end items-center gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${confirmButtonClasses[confirmVariant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
