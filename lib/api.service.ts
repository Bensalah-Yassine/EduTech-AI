// Generic API service to replace Vapi functionality
// This will be a placeholder for future API integrations like OpenAI or Gemini

export interface ApiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ApiConfig {
  subject: string;
  topic: string;
  style: string;
  voice: string;
}

// Define callback types
type CallStartCallback = () => void;
type CallEndCallback = () => void;
type MessageCallback = (message: ApiMessage) => void;
type SpeechStartCallback = () => void;
type SpeechEndCallback = () => void;

type CallbackFunction = 
  | CallStartCallback
  | CallEndCallback
  | MessageCallback
  | SpeechStartCallback
  | SpeechEndCallback;

// Define specific argument types for emit function
type EmitArgs = 
  | []  // for call-start, call-end, speech-start, speech-end
  | [ApiMessage];  // for message

class ApiService {
  private isConnected: boolean = false;
  private isMuted: boolean = false;
  private messages: ApiMessage[] = [];
  private eventListeners: Map<string, CallbackFunction[]> = new Map();

  // Configuration for the API
  private config: ApiConfig | null = null;

  // Connect to the API service
  async connect(config: ApiConfig): Promise<void> {
    this.config = config;
    this.isConnected = true;
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Trigger connection events
    this.emit('call-start');
    
    // Simulate initial assistant message
    setTimeout(() => {
      this.addMessage({
        role: 'assistant',
        content: `Hello! I'm your ${config.subject} tutor. Let's talk about ${config.topic}.`
      });
    }, 1500);
  }

  // Disconnect from the API service
  disconnect(): void {
    this.isConnected = false;
    this.emit('call-end');
  }

  // Send a message to the API
  async sendMessage(content: string): Promise<void> {
    if (!this.isConnected) return;
    
    // Add user message
    this.addMessage({ role: 'user', content });
    
    // Simulate assistant thinking
    this.emit('speech-start');
    
    // Simulate assistant response after delay
    setTimeout(() => {
      this.addMessage({
        role: 'assistant',
        content: `I understand you're asking about "${content}". In ${this.config?.subject}, this relates to ${this.config?.topic}.`
      });
      this.emit('speech-end');
    }, 2000);
  }

  // Toggle microphone mute state
  toggleMute(): void {
    this.isMuted = !this.isMuted;
  }

  // Check if microphone is muted
  getMuted(): boolean {
    return this.isMuted;
  }

  // Add a message to the conversation
  private addMessage(message: ApiMessage): void {
    const messageWithTimestamp = { ...message, timestamp: new Date() };
    this.messages.push(messageWithTimestamp);
    this.emit('message', messageWithTimestamp);
  }

  // Event handling methods
  on(event: 'call-start', callback: CallStartCallback): void;
  on(event: 'call-end', callback: CallEndCallback): void;
  on(event: 'message', callback: MessageCallback): void;
  on(event: 'speech-start', callback: SpeechStartCallback): void;
  on(event: 'speech-end', callback: SpeechEndCallback): void;
  on(event: string, callback: CallbackFunction): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  off(event: 'call-start', callback: CallStartCallback): void;
  off(event: 'call-end', callback: CallEndCallback): void;
  off(event: 'message', callback: MessageCallback): void;
  off(event: 'speech-start', callback: SpeechStartCallback): void;
  off(event: 'speech-end', callback: SpeechEndCallback): void;
  off(event: string, callback: CallbackFunction): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: 'call-start'): void;
  private emit(event: 'call-end'): void;
  private emit(event: 'message', message: ApiMessage): void;
  private emit(event: 'speech-start'): void;
  private emit(event: 'speech-end'): void;
  private emit(event: string, ...args: EmitArgs): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          // Type assertion to call the correct function signature
          if (event === 'call-start' && args.length === 0) {
            (callback as CallStartCallback)();
          } else if (event === 'call-end' && args.length === 0) {
            (callback as CallEndCallback)();
          } else if (event === 'message' && args.length === 1) {
            (callback as MessageCallback)(args[0]);
          } else if (event === 'speech-start' && args.length === 0) {
            (callback as SpeechStartCallback)();
          } else if (event === 'speech-end' && args.length === 0) {
            (callback as SpeechEndCallback)();
          }
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get conversation history
  getMessages(): ApiMessage[] {
    return [...this.messages];
  }

  // Check connection status
  isConnectedStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const apiService = new ApiService();