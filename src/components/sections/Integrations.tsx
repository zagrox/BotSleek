
import React, { useState } from 'react';
import { 
  MessageCircle, 
  Table, 
  Zap, 
  Globe, 
  Search, 
  Check, 
  ExternalLink, 
  Settings2,
  Phone,
  Mail,
  MessageSquare,
  Newspaper,
  Database,
  FileText,
  LayoutTemplate,
  Droplet,
  Server,
  HardDrive,
  BookOpen,
  Info
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'communication' | 'data' | 'tools';
  connected: boolean;
}

const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'megamail',
      name: 'MegaMail',
      description: 'سرویس ایمیل اختصاصی MegaLive برای یکپارچه‌سازی عمیق با سایر سرویس‌های وب ما.',
      icon: <Mail size={24} />,
      category: 'communication',
      connected: false,
    },
    {
      id: 'telegram',
      name: 'Telegram Bot',
      description: 'اتصال ربات به تلگرام برای پاسخگویی خودکار به پیام‌های کاربران در گروه‌ها و چت‌های خصوصی.',
      icon: <MessageCircle size={24} />,
      category: 'communication',
      connected: false,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'اتصال به واتس‌اپ تجاری برای مدیریت مشتریان و ارسال پیام‌های خودکار.',
      icon: <Phone size={24} />,
      category: 'communication',
      connected: false,
    },
    {
      id: 'sms',
      name: 'SMS Gateway',
      description: 'ارسال پیامک‌های اطلاع‌رسانی، کد تایید و هشدارهای سیستمی به کاربران.',
      icon: <MessageSquare size={24} />,
      category: 'communication',
      connected: false,
    },
    {
      id: 'email',
      name: 'Email Service (SMTP)',
      description: 'ارسال ایمیل‌های تراکنشی، خبرنامه و پاسخگویی به ایمیل‌های پشتیبانی.',
      icon: <Mail size={24} />,
      category: 'communication',
      connected: false,
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'اتصال به پایگاه دانش و دیتابیس‌های Notion برای همگام‌سازی محتوا.',
      icon: <BookOpen size={24} />,
      category: 'data',
      connected: false,
    },
    {
      id: 'excel',
      name: 'Excel Live Data',
      description: 'خواندن اطلاعات زنده (مانند لیست قیمت یا موجودی) از فایل اکسل در OneDrive.',
      icon: <Table size={24} />,
      category: 'data',
      connected: false,
    },
    {
      id: 'sheets',
      name: 'Google Sheets',
      description: 'ذخیره اطلاعات کاربران یا خواندن دیتابیس محصولات از گوگل شیت.',
      icon: <Table size={24} />,
      category: 'data',
      connected: false,
    },
    {
      id: 'docs',
      name: 'Google Docs',
      description: 'دسترسی به محتوای اسناد گوگل داکس برای استفاده در پایگاه دانش.',
      icon: <FileText size={24} />,
      category: 'data',
      connected: false,
    },
    {
      id: 'postgre',
      name: 'PostgreSQL',
      description: 'اتصال مستقیم به دیتابیس PostgreSQL برای اجرای کوئری‌های پیچیده.',
      icon: <Database size={24} />,
      category: 'data',
      connected: false,
    },
    {
      id: 'redis',
      name: 'Redis',
      description: 'استفاده از Redis برای مدیریت حافظه پنهان (Cache) و سشن‌های کاربران.',
      icon: <Server size={24} />,
      category: 'data',
      connected: false,
    },
    {
      id: 'qdrant',
      name: 'Qdrant Vector DB',
      description: 'پایگاه داده وکتوری برای جستجوی معنایی پیشرفته و حافظه بلند مدت.',
      icon: <HardDrive size={24} />,
      category: 'data',
      connected: false,
    },
    {
      id: 'news',
      name: 'News API',
      description: 'دریافت و تحلیل اخبار روزانه مرتبط با حوزه فعالیت از منابع معتبر خبری.',
      icon: <Newspaper size={24} />,
      category: 'data',
      connected: false,
    },
    {
      id: 'wordpress',
      name: 'WordPress',
      description: 'مدیریت دیدگاه‌ها، انتشار پست و هماهنگی با سایت‌های وردپرسی.',
      icon: <LayoutTemplate size={24} />,
      category: 'tools',
      connected: false,
    },
    {
      id: 'joomla',
      name: 'Joomla',
      description: 'اتصال به سیستم مدیریت محتوای جوملا برای مدیریت کاربران و مطالب.',
      icon: <LayoutTemplate size={24} />,
      category: 'tools',
      connected: false,
    },
    {
      id: 'drupal',
      name: 'Drupal',
      description: 'یکپارچه‌سازی با CMS دروپال برای پروژه‌های سازمانی.',
      icon: <Droplet size={24} />,
      category: 'tools',
      connected: false,
    },
    {
      id: 'search',
      name: 'Google Search',
      description: 'قابلیت جستجوی زنده در وب برای پاسخ به سوالات روز و اخبار جدید.',
      icon: <Globe size={24} />,
      category: 'tools',
      connected: false,
    },
    {
      id: 'api',
      name: 'Custom API',
      description: 'اتصال به API های اختصاصی یا سرویس‌های شخص ثالث از طریق درخواست‌های HTTP.',
      icon: <Zap size={24} />,
      category: 'tools',
      connected: false,
    },
  ]);

  const toggleIntegration = (id: string) => {
    // Disabled for now as indicated by the banner
    // setIntegrations(prev => prev.map(item => 
    //   item.id === id ? { ...item, connected: !item.connected } : item
    // ));
    alert('این قابلیت به زودی در دسترس خواهد بود.');
  };

  const categories = [
    { id: 'all', label: 'همه' },
    { id: 'communication', label: 'ارتباطی' },
    { id: 'data', label: 'داده‌ها' },
    { id: 'tools', label: 'ابزارها' },
  ];

  const [activeCategory, setActiveCategory] = useState('all');

  const filteredIntegrations = integrations.filter(item => 
    activeCategory === 'all' || item.category === activeCategory
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">قابلیت‌های چت‌بات خود را با اتصال به سرویس‌های خارجی گسترش دهید.</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
        <Info className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" size={20} />
        <div>
            <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-1">به زودی...</h4>
            <p className="text-sm text-blue-700 dark:text-blue-200/80">
                این بخش در حال توسعه است. تمامی افزونه‌ها و ادغام‌ها به زودی برای استفاده در دسترس خواهند بود. از صبر و شکیبایی شما سپاسگزاریم.
            </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredIntegrations.map((item) => (
          <div 
            key={item.id}
            className={`
              relative flex flex-col p-6 rounded-2xl border transition-all duration-300 group opacity-80 hover:opacity-100
              ${item.connected 
                ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 shadow-sm' 
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
              }
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors
                ${item.connected 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-500'
                }
              `}>
                {item.icon}
              </div>
              <div className="flex items-center gap-2">
                {item.connected && (
                   <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="تنظیمات">
                      <Settings2 size={18} />
                   </button>
                )}
                <button
                    onClick={() => toggleIntegration(item.id)}
                    className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-not-allowed opacity-60
                        ${item.connected ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                    `}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform ${item.connected ? '-translate-x-6' : '-translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                    {item.name}
                    {item.connected && <Check size={14} className="text-green-500" />}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                    {item.description}
                </p>
            </div>

            {/* Footer */}
            <div className="pt-4 mt-auto border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                    item.connected 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                    {item.connected ? 'فعال' : 'غیرفعال'}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 opacity-50 cursor-not-allowed">
                    مستندات <ExternalLink size={10} />
                </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Integrations;
