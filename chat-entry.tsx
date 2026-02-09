import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatWidget from './src/components/ChatWidget';

// Custom CSS for the iframe's context
const styles = `
  /* Custom Scrollbar for webkit */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

  @keyframes fade-in-widget {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-in-widget {
    animation: fade-in-widget 0.4s ease-out forwards;
  }

  /* Chat bubble content formatting */
  .chat-content p:not(:last-child) {
    margin-bottom: 0.75rem;
  }
  .chat-content ul {
    list-style-type: disc;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    padding-right: 1rem; /* RTL padding */
  }
  .chat-content li {
    margin-bottom: 0.25rem;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount chat widget");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ChatWidget />
  </React.StrictMode>
);