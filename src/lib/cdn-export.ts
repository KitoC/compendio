
// Define the library's public API
const ConvoSyncLib = {
  version: '1.0.0',
  
  // Example utility function
  formatDate: (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  },
  
  // Example method to initialize a chat widget
  initChatWidget: (selector: string, options: any = {}): void => {
    console.log(`Initializing chat widget on ${selector} with options:`, options);
    const targetEl = document.querySelector(selector);
    
    if (!targetEl) {
      console.error(`Target element not found: ${selector}`);
      return;
    }
    
    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'convosync-widget';
    widgetContainer.innerHTML = `
      <div class="convosync-widget-header">
        <h3>ConvoSync Chat</h3>
      </div>
      <div class="convosync-widget-body">
        <div class="convosync-messages"></div>
        <div class="convosync-input">
          <input type="text" placeholder="Type your message...">
          <button>Send</button>
        </div>
      </div>
    `;
    
    // Apply some basic styles
    const style = document.createElement('style');
    style.textContent = `
      .convosync-widget {
        border: 1px solid #e1e1e1;
        border-radius: 8px;
        overflow: hidden;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        max-width: 400px;
      }
      .convosync-widget-header {
        background: #f5f5f5;
        padding: 10px 15px;
        border-bottom: 1px solid #e1e1e1;
      }
      .convosync-widget-header h3 {
        margin: 0;
        font-size: 16px;
      }
      .convosync-widget-body {
        display: flex;
        flex-direction: column;
        height: 300px;
      }
      .convosync-messages {
        flex: 1;
        padding: 15px;
        overflow-y: auto;
      }
      .convosync-input {
        display: flex;
        padding: 10px;
        border-top: 1px solid #e1e1e1;
      }
      .convosync-input input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-right: 8px;
      }
      .convosync-input button {
        background: #4f46e5;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 15px;
        cursor: pointer;
      }
    `;
    
    // Append elements to the DOM
    targetEl.appendChild(style);
    targetEl.appendChild(widgetContainer);
    
    // Add event listeners
    const inputEl = widgetContainer.querySelector('input');
    const buttonEl = widgetContainer.querySelector('button');
    const messagesEl = widgetContainer.querySelector('.convosync-messages');
    
    if (inputEl && buttonEl && messagesEl) {
      const addMessage = (text: string, isUser = false) => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isUser ? 'user' : 'bot'}`;
        messageEl.style.padding = '8px 12px';
        messageEl.style.margin = '4px 0';
        messageEl.style.borderRadius = '4px';
        messageEl.style.maxWidth = '80%';
        messageEl.style.alignSelf = isUser ? 'flex-end' : 'flex-start';
        messageEl.style.backgroundColor = isUser ? '#4f46e5' : '#f0f0f0';
        messageEl.style.color = isUser ? 'white' : 'black';
        messageEl.textContent = text;
        messagesEl.appendChild(messageEl);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      };
      
      buttonEl.addEventListener('click', () => {
        const text = (inputEl as HTMLInputElement).value.trim();
        if (text) {
          addMessage(text, true);
          (inputEl as HTMLInputElement).value = '';
          
          // Simulate a response
          setTimeout(() => {
            addMessage(`Thanks for your message: "${text}". This is a demo widget.`);
          }, 1000);
        }
      });
      
      inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          buttonEl.click();
        }
      });
      
      // Add initial message
      addMessage('Hello! How can I help you today?');
    }
  }
};

// Export the library
export default ConvoSyncLib;
