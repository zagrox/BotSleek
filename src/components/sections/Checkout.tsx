
import React, { useState, useEffect, useRef } from 'react';
import { Plan, Order, Transaction } from '../../types';
import { ArrowLeft, Check, CreditCard, Landmark, ShieldCheck, AlertCircle, Bot, MessageSquare, Database, Cpu, Loader2, FileText, CheckCircle2, BookOpenCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { directus } from '../../services/directus';
import { createItem, readItem, updateItem } from '@directus/sdk';

interface CheckoutProps {
  plan: Plan | null;
  onBack: () => void;
  onSuccess: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ plan, onBack, onSuccess }) => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('online');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [offlineOrder, setOfflineOrder] = useState<Order | null>(null);
  const [paymentNote, setPaymentNote] = useState('');
  
  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  if (!plan) {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <AlertCircle size={48} className="mb-4 opacity-20" />
            <p>No plan selected. Please go back and select a plan.</p>
            <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">Back to Pricing</button>
        </div>
    );
  }

  const basePrice = billingCycle === 'monthly' ? plan.plan_monthly : plan.plan_yearly;
  const finalPrice = basePrice;

  const handlePayment = async () => {
    if (!user || !user.profile?.id || !plan) {
        setError('User information incomplete. Please log in again.');
        return;
    }

    setIsProcessing(true);
    setError(null);
    setStatusMessage('Creating order...');

    try {
        const isFreeOrder = finalPrice === 0;
        let initialStatus = 'pending';
        if (isFreeOrder) initialStatus = 'completed';
        else if (paymentMethod === 'offline') initialStatus = 'processing';

        const orderPayload = {
            order_status: initialStatus,
            order_duration: billingCycle,
            order_amount: finalPrice.toString(),
            order_profile: user.profile.id,
            order_plan: plan.id
        };

        // @ts-ignore
        const newOrder = await directus.request(createItem('order', orderPayload)) as Order;
        
        if (isFreeOrder) {
            setStatusMessage('Free plan activated successfully.');
            setTimeout(() => {
                onSuccess();
            }, 1000);
            return;
        }

        if (paymentMethod === 'offline') {
            setOfflineOrder(newOrder);
            setIsProcessing(false);
            return;
        }

        setStatusMessage('Connecting to payment gateway...');
        
        let attempts = 0;
        const maxAttempts = 30;

        pollIntervalRef.current = setInterval(async () => {
            attempts++;
            try {
                // @ts-ignore
                const updatedOrder = await directus.request(readItem('order', newOrder.id, {
                    fields: ['order_transaction']
                })) as Order;

                if (updatedOrder.order_transaction) {
                    const transactionId = updatedOrder.order_transaction;
                    // @ts-ignore
                    const transaction = await directus.request(readItem('transaction', transactionId, {
                        fields: ['trackid']
                    })) as Transaction;

                    if (transaction && transaction.trackid) {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                        setStatusMessage('Redirecting to gateway...');
                        window.location.href = `https://gateway.zibal.ir/start/${transaction.trackid}`;
                    }
                }

                if (attempts >= maxAttempts) {
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    setError('Timeout receiving payment ID. Please try again in a few minutes or contact support.');
                    setIsProcessing(false);
                }
            } catch (pollErr) {
                console.warn("Polling error:", pollErr);
            }
        }, 2000);

    } catch (err: any) {
        console.error('Payment initiation failed:', err);
        setError('Error registering order. Please try again.');
        setIsProcessing(false);
    }
  };

  const handleSubmitNote = async () => {
      if (!offlineOrder) return;
      
      setIsProcessing(true);
      try {
          // @ts-ignore
          await directus.request(updateItem('order', offlineOrder.id, {
              order_note: paymentNote
          }));
          
          setStatusMessage('Payment info registered.');
          setTimeout(() => {
              onSuccess();
          }, 1000);
      } catch (err) {
          console.error("Failed to update note:", err);
          setError("Error saving details. Please try again.");
          setIsProcessing(false);
      }
  };

  if (offlineOrder) {
      return (
        <div className="max-w-xl mx-auto py-12 animate-fade-in text-left" dir="ltr">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Order Created Successfully</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                    Order ID: <span className="font-mono font-bold text-gray-800 dark:text-gray-200 mx-1">#{offlineOrder.id}</span>
                </p>

                <div className="text-left bg-gray-50 dark:bg-gray-800 p-4 rounded-xl mb-6 border border-gray-100 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <FileText size={16} className="text-blue-500" />
                        Record Payment Info
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                        Please enter the source card number, reference number, date, time or any other details to help us verify your transfer.
                    </p>
                    <textarea 
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        rows={4}
                        placeholder="e.g. Bank Transfer - Ref: 123456 - Time: 10:30"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all resize-none text-sm"
                    />
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <button 
                    onClick={handleSubmitNote}
                    disabled={isProcessing || !paymentNote.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isProcessing ? <Loader2 className="animate-spin" /> : 'Submit Details & Finish'}
                </button>
                
                <button 
                    onClick={onSuccess}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                    Skip and go to Orders
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12 text-left" dir="ltr">
      <div className="flex items-center gap-4">
        <button onClick={onBack} disabled={isProcessing} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
            <ArrowLeft size={24} />
        </button>
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Checkout</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Review and finalize your subscription details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Billing Cycle */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Billing Cycle</h3>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setBillingCycle('monthly')}
                        disabled={isProcessing}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-between ${billingCycle === 'monthly' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}
                    >
                        <span className="font-bold text-gray-700 dark:text-gray-200">Monthly</span>
                        {billingCycle === 'monthly' && <Check size={20} className="text-blue-600" />}
                    </button>
                    <button 
                        onClick={() => setBillingCycle('yearly')}
                        disabled={isProcessing}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-between ${billingCycle === 'yearly' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}
                    >
                        <div>
                            <span className="font-bold text-gray-700 dark:text-gray-200 block">Yearly</span>
                            <span className="text-xs text-green-600 dark:text-green-400 block mt-1">2 Months Free</span>
                        </div>
                        {billingCycle === 'yearly' && <Check size={20} className="text-blue-600" />}
                    </button>
                </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Payment Method</h3>
                <div className="space-y-3">
                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                        <input 
                            type="radio" 
                            name="payment" 
                            className="hidden" 
                            checked={paymentMethod === 'online'}
                            onChange={() => setPaymentMethod('online')}
                            disabled={isProcessing}
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-blue-600' : 'border-gray-400'}`}>
                            {paymentMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                        </div>
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-blue-600 dark:text-blue-400 shadow-sm">
                            <CreditCard size={24} />
                        </div>
                        <div className="flex-1">
                            <span className="font-bold text-gray-800 dark:text-white block">Online Payment</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Secure payment with local debit/credit cards</span>
                        </div>
                    </label>

                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'offline' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                        <input 
                            type="radio" 
                            name="payment" 
                            className="hidden" 
                            checked={paymentMethod === 'offline'}
                            onChange={() => setPaymentMethod('offline')}
                            disabled={isProcessing}
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'offline' ? 'border-blue-600' : 'border-gray-400'}`}>
                            {paymentMethod === 'offline' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                        </div>
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-amber-600 dark:text-amber-400 shadow-sm">
                            <Landmark size={24} />
                        </div>
                        <div className="flex-1">
                            <span className="font-bold text-gray-800 dark:text-white block">Bank Transfer</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Manual transfer (Approval by support team)</span>
                        </div>
                    </label>
                </div>

                {paymentMethod === 'offline' && (
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-bold mb-2">Account Info:</p>
                        <p className="font-mono mb-1">Pasargad Bank</p>
                        <p className="font-mono">Card: 5022.2910.8932.4477</p>
                        <p className="font-mono text-xs opacity-70 mt-2">Please register your payment reference after the transfer.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sticky top-24 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Summary</h3>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-800 dark:text-white capitalize">{plan.plan_name}</span>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">
                            {billingCycle === 'monthly' ? '1 Month' : '1 Year'}
                        </span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Bot size={14} /> <span>{plan.plan_bots} Bot(s)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <MessageSquare size={14} /> <span>{plan.plan_messages.toLocaleString('en-US')} Messages</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Database size={14} /> <span>{plan.plan_storage.toLocaleString('en-US')} MB</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Cpu size={14} /> <span>{plan.plan_llm} Training Files</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 font-bold">
                        <span>Plan Price</span>
                        <span className="font-mono">{basePrice.toLocaleString('en-US')} <span className="text-xs">Toman</span></span>
                    </div>
                </div>

                <div className="pt-4 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800 dark:text-white">Total Amount</span>
                        <div className="text-right">
                            <span className="block text-xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                                {finalPrice.toLocaleString('en-US')}
                            </span>
                            <span className="text-xs text-gray-500">Toman</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs flex items-start gap-2">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        {error}
                    </div>
                )}

                <button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>{statusMessage || 'Processing...'}</span>
                        </>
                    ) : (
                        <>
                            {paymentMethod === 'online' ? (finalPrice === 0 ? 'Start Now' : 'Pay & Activate') : 'Place Order'}
                            <ShieldCheck size={18} />
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
