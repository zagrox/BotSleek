
import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Camera, Save, Shield, Key, Bell, Check, Globe, Send, Instagram, Briefcase, ArrowUpRight, Calendar, Clock, Infinity, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAssetUrl } from '../../services/directus';
import { fetchPricingPlans } from '../../services/configService';
import { Plan } from '../../types';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    company: user?.profile?.profile_company || '',
    phone: user?.profile?.profile_phone || '',
    website: user?.profile?.profile_website || '',
    instagram: user?.profile?.profile_instagram || '',
    telegram: user?.profile?.profile_telegram || '',
    notifications: true,
    twoFactor: true
  });

  useEffect(() => {
    fetchPricingPlans().then(setPlans);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.first_name ?? '',
        lastName: user.last_name ?? '',
        email: user.email ?? '',
        company: user.profile?.profile_company ?? '',
        phone: user.profile?.profile_phone ?? '',
        website: user.profile?.profile_website ?? '',
        instagram: user.profile?.profile_instagram ?? '',
        telegram: user.profile?.profile_telegram ?? '',
      }));
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      await updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        profileData: {
            profile_company: formData.company,
            profile_phone: formData.phone,
            profile_website: formData.website,
            profile_instagram: formData.instagram,
            profile_telegram: formData.telegram,
        }
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert('Error saving profile. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const userAvatar = user?.avatar ? getAssetUrl(user.avatar) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.firstName}`;
  const isOfficial = user?.profile?.profile_official;
  const profileColor = user?.profile?.profile_color || '#3b82f6';
  
  const getPlanDisplay = () => {
      const rawPlan = user?.profile?.profile_plan;
      if (!rawPlan) return 'Free';
      const matched = plans.find(p => 
          p.id === Number(rawPlan) || 
          (typeof rawPlan === 'object' && (rawPlan as any)?.id === p.id) ||
          String(p.plan_name || '').toLowerCase() === String(rawPlan || '').toLowerCase()
      );
      if (matched) return matched.plan_name;
      return typeof rawPlan === 'string' ? rawPlan : 'Free';
  };

  const displayPlanName = getPlanDisplay();
  const planDuration = user?.profile?.profile_duration;
  const startDate = user?.profile?.profile_start;
  const endDate = user?.profile?.profile_end;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getRemainingDays = () => {
    if (displayPlanName.toLowerCase() === 'free' || !endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return <span className="text-xs text-red-500 mt-0.5 font-medium">Expired</span>;
    if (diffDays === 0) return <span className="text-xs text-amber-500 mt-0.5 font-medium">Expires Today</span>;
    return <span className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium">{diffDays} days left</span>;
  };

  return (
    <div className="space-y-8 animate-fade-in text-left" dir="ltr">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Manage personal information and organizational profile.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center relative overflow-hidden shadow-sm">
             <div className="absolute top-0 left-0 w-full h-32 opacity-90 transition-colors" style={{ background: `linear-gradient(to right, ${profileColor}, #8b5cf6)` }}></div>
             <div className="relative mt-12 mb-4">
                <div className="w-28 h-28 mx-auto rounded-full border-4 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-800 overflow-hidden shadow-lg relative group cursor-pointer">
                    <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={24} />
                    </div>
                </div>
             </div>
             <div className="flex items-center justify-center gap-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{formData.firstName} {formData.lastName}</h3>
                {isOfficial && <Check className="text-blue-500 bg-blue-100 dark:bg-blue-900 rounded-full p-0.5" size={16} />}
             </div>
             <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-6">{formData.company || 'No Company Registered'}</p>
             <div className="flex justify-center gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                <div className="text-center">
                    <span className="block text-lg font-bold text-gray-800 dark:text-white capitalize">{displayPlanName}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Current Plan</span>
                </div>
                <div className="w-px bg-gray-200 dark:bg-gray-800"></div>
                <div className="text-center">
                    <span className="block text-lg font-bold text-gray-800 dark:text-white">{isOfficial ? 'Official' : 'Standard'}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Account Type</span>
                </div>
             </div>
             <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock size={16} />
                        <span>Billing Cycle:</span>
                    </div>
                    {planDuration ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${planDuration === 'yearly' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                            {planDuration === 'yearly' ? 'Yearly' : 'Monthly'}
                        </span>
                    ) : <span className="text-gray-400 text-xs">-</span>}
                </div>
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar size={16} />
                        <span>Start Date:</span>
                    </div>
                    <span className="font-mono text-gray-800 dark:text-gray-200">{formatDate(startDate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar size={16} />
                        <span>Expiry Date:</span>
                    </div>
                    {displayPlanName.toLowerCase() === 'free' ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium"><Infinity size={14} /> Unlimited</span>
                    ) : (
                        <div className="flex flex-col items-end">
                            <span className="font-mono text-gray-800 dark:text-gray-200">{formatDate(endDate)}</span>
                            {getRemainingDays()}
                        </div>
                    )}
                </div>
             </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
              <button className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><ShoppingBag size={18} /></div>
                      <span className="font-medium text-gray-700 dark:text-gray-200">My Orders</span>
                  </div>
                  <ArrowUpRight size={16} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </button>
              <p className="text-xs text-gray-400 mt-2 px-1">To view your financial records, select "My Orders" from the top menu.</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Shield size={18} className="text-green-500" /> Account Security</h4>
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg"><Key size={18} /></div>
                          <div className="text-sm">
                              <p className="font-medium text-gray-800 dark:text-gray-200">2FA Authentication</p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Enabled for extra security</p>
                          </div>
                      </div>
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${formData.twoFactor ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} onClick={() => setFormData({...formData, twoFactor: !formData.twoFactor})}>
                          <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${formData.twoFactor ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                  </div>
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg"><Bell size={18} /></div>
                          <div className="text-sm">
                              <p className="font-medium text-gray-800 dark:text-gray-200">Security Alerts</p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Email notifications for logins</p>
                          </div>
                      </div>
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${formData.notifications ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} onClick={() => setFormData({...formData, notifications: !formData.notifications})}>
                          <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${formData.notifications ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                  </div>
              </div>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 lg:p-8 shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Edit Profile</h3>
                <button onClick={handleSave} disabled={loading} className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg ${success ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : success ? <><Check size={18} /><span>Saved</span></> : <><Save size={18} /><span>Save Changes</span></>}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><User size={16} className="text-gray-400" /> First Name</label>
                    <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 dark:text-white" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                    <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 dark:text-white" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><Mail size={16} className="text-gray-400" /> Email Address</label>
                    <input type="email" value={formData.email} disabled className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 rounded-xl outline-none text-gray-500 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><Phone size={16} className="text-gray-400" /> Phone Number</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1..." className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 dark:text-white" />
                </div>
                 <div className="space-y-2 md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                     <h4 className="text-md font-bold text-gray-800 dark:text-white mb-2">Additional Information</h4>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><Briefcase size={16} className="text-gray-400" /> Company Name</label>
                    <input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} placeholder="Company Name" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 dark:text-white" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><Globe size={16} className="text-gray-400" /> Website</label>
                    <input type="text" value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} placeholder="example.com" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 dark:text-white" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><Instagram size={16} className="text-gray-400" /> Instagram</label>
                    <input type="text" value={formData.instagram} onChange={(e) => setFormData({...formData, instagram: e.target.value})} placeholder="username" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 dark:text-white" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><Send size={16} className="text-gray-400" /> Telegram</label>
                    <input type="text" value={formData.telegram} onChange={(e) => setFormData({...formData, telegram: e.target.value})} placeholder="@username" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 dark:text-white" />
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
