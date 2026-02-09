
import React from 'react';
import { Copy, Check, Webhook } from 'lucide-react';
import { Chatbot } from '../../types';

interface DeployProps {
  selectedChatbot: Chatbot | null;
}

const Deploy: React.FC<DeployProps> = ({ selectedChatbot }) => {
  const [copiedEmbed, setCopiedEmbed] = React.useState(false);
  const [copiedWebhook, setCopiedWebhook] = React.useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'YOUR_APP_URL';
  
  const embedCode = `<script src="${baseUrl}/widget.js"></script>
<script>
  window.initMEGABot({
    botId: "${selectedChatbot?.id || 'YOUR_BOT_ID'}",
    baseUrl: "${baseUrl}"
  });
</script>`;

  const webhookUrl = selectedChatbot?.chatbot_webhook || 'Webhook URL not available';

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left" dir="ltr">
       <div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Methods to connect and use your chatbot.</p>
      </div>

      {/* Embed Code Section */}
      <div className="bg-gray-900 rounded-xl p-6 relative overflow-hidden border border-gray-800 dark:border-gray-700">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <div className="flex justify-between items-start mb-4">
            <span className="text-gray-400 text-xs font-mono">HTML Embed Code</span>
            <button 
                onClick={handleCopyEmbed}
                className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
                {copiedEmbed ? <Check size={14} className="text-green-400"/> : <Copy size={14} />}
                {copiedEmbed ? 'Copied' : 'Copy Code'}
            </button>
        </div>
        <pre className="font-mono text-sm text-blue-300 overflow-x-auto dir-ltr text-left bg-black/30 p-4 rounded-lg border border-white/5">
            <code>
              {embedCode}
            </code>
        </pre>
      </div>

      {/* Webhook Section */}
      <div className="bg-gray-900 rounded-xl p-6 relative overflow-hidden border border-gray-800 dark:border-gray-700">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
                <Webhook size={16} className="text-emerald-400" />
                <span className="text-gray-400 text-xs font-mono">API Webhook Endpoint</span>
            </div>
            <button 
                onClick={handleCopyWebhook}
                className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
                {copiedWebhook ? <Check size={14} className="text-green-400"/> : <Copy size={14} />}
                {copiedWebhook ? 'Copied' : 'Copy URL'}
            </button>
        </div>
        <div className="font-mono text-sm text-emerald-300 overflow-x-auto dir-ltr text-left bg-black/30 p-4 rounded-lg border border-white/5 mb-4">
            {webhookUrl}
        </div>
        
        <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-gray-300 mb-3">Input Parameters (JSON Body):</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono dir-ltr text-left">
                <div className="bg-black/20 p-3 rounded border border-white/5">
                    <span className="text-blue-400 block mb-1">sessionId</span>
                    <span className="text-gray-500">String (Unique ID)</span>
                </div>
                <div className="bg-black/20 p-3 rounded border border-white/5">
                    <span className="text-blue-400 block mb-1">action</span>
                    <span className="text-gray-500">String (e.g., "chat")</span>
                </div>
                <div className="bg-black/20 p-3 rounded border border-white/5">
                    <span className="text-blue-400 block mb-1">chatInput</span>
                    <span className="text-gray-500">String (User Message)</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-200 dark:hover:border-blue-800 transition-colors cursor-pointer group bg-white dark:bg-gray-800">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Direct Link</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get the dedicated chatbot page link for direct sharing.</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-200 dark:hover:border-blue-800 transition-colors cursor-pointer group bg-white dark:bg-gray-800">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Telegram Connect</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Launch your bot on Telegram with one click.</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-200 dark:hover:border-blue-800 transition-colors cursor-pointer group bg-white dark:bg-gray-800">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">API Key</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Obtain an API key to use in other applications.</p>
          </div>
      </div>
    </div>
  );
};

export default Deploy;
