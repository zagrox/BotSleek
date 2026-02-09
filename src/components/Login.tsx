
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, Loader2, KeyRound, CheckCircle2, ArrowLeft, UserPlus, User } from 'lucide-react';

const Login: React.FC = () => {
  const { login, register, requestReset, confirmReset, error: authError } = useAuth();
  const [view, setView] = useState<'login' | 'forgot' | 'reset' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const isRegister = params.has('register');
    if (token) {
      setResetToken(token);
      setView('reset');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (isRegister) {
      setView('register');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    setLocalError(null);
    setSuccessMessage(null);
    setPassword('');
  }, [view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await login(email, password);
    } catch (err) {} finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) return;
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await register({ firstName, lastName, email, password });
    } catch (err) {
      setIsSubmitting(false);
    } 
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await requestReset(email);
      setSuccessMessage('Password reset link has been sent to your email.');
    } catch (err) {
      setLocalError('Failed to send email. Please check your address.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !resetToken) return;
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await confirmReset(resetToken, password);
      setSuccessMessage('Password changed successfully. You can now login.');
      setTimeout(() => {
        setView('login');
      }, 2000);
    } catch (err) {
      setLocalError('Failed to change password. Link might be expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const error = localError || authError;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="bg-blue-600 dark:bg-blue-700 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner">
              {view === 'login' && <Lock className="text-white" size={32} />}
              {view === 'register' && <UserPlus className="text-white" size={32} />}
              {view === 'forgot' && <KeyRound className="text-white" size={32} />}
              {view === 'reset' && <CheckCircle2 className="text-white" size={32} />}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {view === 'login' ? 'BotSleek' : 
               view === 'register' ? 'Create Account' :
               view === 'forgot' ? 'Forgot Password' : 
               'New Password'}
            </h1>
            <p className="text-blue-100 text-sm">
              {view === 'login' ? 'Please login to access your dashboard' : 
               view === 'register' ? 'Enter your details to register' :
               view === 'forgot' ? 'Enter your email to receive a reset link' :
               'Enter your new password below'}
            </p>
          </div>
        </div>

        <div className="p-8">
          {successMessage ? (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-xl border border-green-100 dark:border-green-800 text-center mb-6 animate-fade-in">
              <div className="flex justify-center mb-2">
                <CheckCircle2 size={32} />
              </div>
              <p className="text-sm font-medium">{successMessage}</p>
              {view === 'forgot' && (
                <button onClick={() => setView('login')} className="mt-4 text-blue-600 hover:underline text-sm font-medium">
                  Back to Login
                </button>
              )}
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl border border-red-100 dark:border-red-800 flex items-center justify-center mb-6 animate-fade-in">
                  {error}
                </div>
              )}

              {view === 'login' && (
                <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white transition-all"
                        placeholder=""
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Password</label>
                      <button type="button" onClick={() => setView('forgot')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white transition-all"
                        placeholder=""
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Don't have an account? {' '}
                      <button type="button" onClick={() => setView('register')} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                        Register
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {view === 'register' && (
                <form onSubmit={handleRegister} className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                      minLength={5}
                      required
                    />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={20} /><span>Register</span></>}
                  </button>
                  <button type="button" onClick={() => setView('login')} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                    <ArrowLeft size={18} /><span>Back to Login</span>
                  </button>
                </form>
              )}

              {view === 'forgot' && (
                <form onSubmit={handleForgot} className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Enter your Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Mail size={20} /><span>Send Reset Link</span></>}
                  </button>
                  <button type="button" onClick={() => setView('login')} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium py-3.5 rounded-xl flex items-center justify-center gap-2">
                    <ArrowLeft size={18} /><span>Back to Login</span>
                  </button>
                </form>
              )}

              {view === 'reset' && (
                <form onSubmit={handleReset} className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">New Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                      required
                      minLength={8}
                    />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /><span>Update Password</span></>}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400">BotSleek is Powered by Advering.com</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
