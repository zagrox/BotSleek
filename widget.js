(function () {
  'use strict';

  // This value is replaced by Vite's `define` config during the build process.
  // It effectively hardcodes the backend URL into the script, removing it from the user-facing embed code.
  const API_URL = process.env.DIRECTUS_CRM_URL;

  // This will be called by the user's script tag
  window.initMEGABot = function (options) {
    // --- 1. Validate options ---
    if (!options || !options.botId || !options.baseUrl) {
      console.error("MEGABot: botId and baseUrl are required.");
      return;
    }

    // Check if the API_URL was correctly injected during the build.
    if (!API_URL) {
      console.error("MEGABot: API URL is not configured in the widget script. Please check the build process.");
      return;
    }

    // --- 2. Widget creation logic (now async) ---
    const createWidget = async () => {
      try {
        const { botId, baseUrl } = options;
        const apiUrl = API_URL; // Use the injected constant
        
        // --- Fetch config for color and status ---
        const configUrl = `${apiUrl}/items/chatbot?filter[id][_eq]=${botId}&fields=chatbot_color,chatbot_active`;
        const response = await fetch(configUrl);
        if (!response.ok) {
          console.error(`MEGABot: Failed to fetch config (${response.status} ${response.statusText})`);
          return;
        }
        const jsonResponse = await response.json();
        const botData = jsonResponse.data?.[0];

        if (!botData) {
          console.error("MEGABot: Bot configuration not found or access denied.");
          return;
        }

        // If bot is not active, do not render the widget at all.
        if (!botData.chatbot_active) {
          console.log("MEGABot: Bot is inactive, launcher will not be shown.");
          return;
        }
        
        const primaryColor = botData.chatbot_color || '#3b82f6';
        const IFRAME_URL = `${baseUrl}/chat.html?id=${botId}`;

        // Avoid creating multiple widgets
        if (document.querySelector('.chatbot-launcher')) {
          return;
        }

        // --- Create and inject CSS for styling ---
        const style = document.createElement('style');
        style.textContent = `
          :root { --chatbot-primary-color: #3b82f6; }

          @keyframes launcher-fade-in {
            from { opacity: 0; transform: translateY(20px) scale(0.9); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          .chatbot-launcher {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background-color: var(--chatbot-primary-color);
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s ease-in-out;
            z-index: 9999998;
            animation: launcher-fade-in 0.5s 0.5s ease-out backwards;
          }
          .chatbot-launcher:hover { transform: scale(1.1); }
          .chatbot-launcher svg { color: white; }
          
          .chatbot-container {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 400px;
            height: 600px;
            max-height: calc(100vh - 110px);
            max-width: calc(100vw - 40px);
            border-radius: 1.5rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            overflow: hidden;
            transform-origin: bottom right;
            transition: transform 0.3s ease-out, opacity 0.3s ease-out, width 0.3s, height 0.3s, bottom 0.3s, right 0.3s;
            transform: scale(0.9);
            opacity: 0;
            pointer-events: none;
            z-index: 9999999;
          }
          .chatbot-container.open {
            transform: scale(1);
            opacity: 1;
            pointer-events: auto;
          }
          .chatbot-container.fullscreen {
            width: 100vw !important;
            height: 100vh !important;
            bottom: 0 !important;
            right: 0 !important;
            border-radius: 0 !important;
            max-width: none !important;
            max-height: none !important;
            transform: none !important;
          }
          .chatbot-iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
        `;
        document.head.appendChild(style);
        
        // --- Safely set the primary color for the launcher ---
        document.documentElement.style.setProperty('--chatbot-primary-color', primaryColor);

        // --- Create Chatbot Launcher Button ---
        const launcher = document.createElement('div');
        launcher.className = 'chatbot-launcher';
        launcher.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        `;

        // --- Create Iframe Container ---
        const container = document.createElement('div');
        container.className = 'chatbot-container';

        // --- Create Iframe ---
        const iframe = document.createElement('iframe');
        iframe.className = 'chatbot-iframe';
        iframe.src = IFRAME_URL;
        iframe.title = "Chatbot Widget"; // Accessibility

        // --- Append elements to the body ---
        container.appendChild(iframe);
        document.body.appendChild(launcher);
        document.body.appendChild(container);

        // --- Event Listener to toggle chat window ---
        launcher.addEventListener('click', () => {
          container.classList.toggle('open');
        });

        // --- Event Listener for Messages from Iframe ---
        window.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'MEGALIVE_TOGGLE_FULLSCREEN') {
            if (event.data.value) {
              container.classList.add('fullscreen');
            } else {
              container.classList.remove('fullscreen');
            }
          }
        });

      } catch (error) {
        console.error("MEGABot: Error initializing widget.", error);
      }
    };

    // --- 3. Execute widget creation at the right time ---
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      createWidget();
    } else {
      document.addEventListener('DOMContentLoaded', createWidget, { once: true });
    }
  };
})();