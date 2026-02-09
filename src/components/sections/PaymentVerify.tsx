
import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, RefreshCw, ShoppingBag } from 'lucide-react';

interface PaymentVerifyProps {
  onContinue: () => void;
}

const WEBHOOK_URL = 'https://crm.megalive.ir/flows/trigger/76668ccc-f927-4382-96f5-188020b2c0a1';

const PaymentVerify: React.FC<PaymentVerifyProps> = ({ onContinue }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Verifying transaction status...');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    setStatus('loading');
    setMessage('Inquiring from bank gateway...');

    // 1. Extract Params
    const urlParams = new URLSearchParams(window.location.search);
    const trackId = urlParams.get('trackId') || urlParams.get('trackid');
    const success = urlParams.get('success');
    const paymentStatus = urlParams.get('status');

    if (!trackId) {
        setStatus('failed');
        setMessage('Tracking ID (trackId) not found in the URL.');
        return;
    }

    try {
        // 2. Call Verification Webhook
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trackId: trackId,
                success: success,
                status: paymentStatus
            })
        });

        const data = await response.json();

        // 3. Handle Response
        if (response.ok && (data.success || data.status === 'success' || data.data?.status === 'success')) {
            setStatus('success');
            setMessage('Payment completed successfully. Your subscription is now active.');
        } else {
            setStatus('failed');
            setMessage(data.message || 'Payment operation failed or was cancelled by the user.');
        }

    } catch (err) {
        console.error("Verification error:", err);
        setStatus('failed');
        setMessage('Server error during payment verification.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in p-4 text-center" dir="ltr">
      
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-xl">
          
          {status === 'loading' && (
              <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 size={64} className="text-blue-600 animate-spin" />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Please Wait</h2>
                  <p className="text-gray-500 dark:text-gray-400">{message}</p>
              </div>
          )}

          {status === 'success' && (
              <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-2">
                      <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">Payment Successful</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{message}</p>
                  
                  <button 
                    onClick={() => {
                        window.history.replaceState({}, document.title, window.location.pathname);
                        onContinue();
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                      <ShoppingBag size={20} />
                      <span>View My Orders</span>
                  </button>
              </div>
          )}

          {status === 'failed' && (
              <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-2">
                      <XCircle size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Payment Failed</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{message}</p>
                  
                  <div className="flex flex-col gap-3 w-full">
                    <button 
                        onClick={verifyPayment}
                        className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} />
                        <span>Retry Inquiry</span>
                    </button>
                    <button 
                        onClick={() => {
                            window.history.replaceState({}, document.title, window.location.pathname);
                            onContinue();
                        }}
                        className="w-full text-blue-600 dark:text-blue-400 font-medium py-2 hover:underline text-sm"
                    >
                        Back to Dashboard
                    </button>
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};

export default PaymentVerify;
