import Pusher from 'pusher-js';

// Pusher configuration
const PUSHER_KEY = '3176d4fd304cfadf33dd';
const PUSHER_CLUSTER = 'eu';

class PusherService {
  private pusher: Pusher | null = null;
  private channels: Map<string, any> = new Map();
  private callbacks: Map<string, Set<(data: any) => void>> = new Map();
  private eventHandlers: Map<string, Map<string, (data: any) => void>> = new Map();

  /**
   * Initialize Pusher connection
   */
  initialize(): void {
    if (typeof window !== 'undefined' && !this.pusher) {
      this.pusher = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
      });
      
      // Connection event handlers (silent)
      this.pusher.connection.bind('state_change', () => {
        // Connection state changed
      });
      
      this.pusher.connection.bind('connected', () => {
        // Connected successfully
      });
      
      this.pusher.connection.bind('error', () => {
        // Connection error (silent)
      });
    }
  }

  /**
   * Subscribe to organization channel
   */
  subscribe(organizationId: number, onEvent: (data: any) => void): () => void {
    if (!this.pusher) {
      return () => {}; // Return empty unsubscribe function
    }

    const channelName = `organization.${organizationId}`;
    
    // Get or create channel
    let channel = this.channels.get(channelName);
    let isNewChannel = false;
    
    // If channel exists, we don't need to unbind handlers (they're shared)
    if (!channel) {
      isNewChannel = true;
      // Subscribe to organization channel
      channel = this.pusher.subscribe(channelName);
      this.channels.set(channelName, channel);
      
      // Initialize event handlers map for this channel
      if (!this.eventHandlers.has(channelName)) {
        this.eventHandlers.set(channelName, new Map());
      }
    }

    // Store the callback (support multiple callbacks per channel)
    if (!this.callbacks.has(channelName)) {
      this.callbacks.set(channelName, new Set());
    }
    this.callbacks.get(channelName)!.add(onEvent);

    // Create a handler function that calls all registered callbacks
    // IMPORTANT: Use arrow function to capture 'this' and ensure callbacks are always retrieved fresh
    const createEventHandler = (eventType: string) => {
      return (data: any) => {
        // Always get fresh callbacks to ensure we have the latest ones
        const callbacks = this.callbacks.get(channelName);
        
        if (callbacks && callbacks.size > 0) {
          callbacks.forEach(callback => {
            try {
              callback(data);
            } catch (error) {
              // Silent error handling
            }
          });
        }
      };
    };

    // Bind to multiple possible event types for notifications and chat (only if new channel)
    if (isNewChannel) {
      const eventTypes = [
        'organization-event', 
        'notification', 
        'NotificationCreated', 
        'notification.created',
        'chat.message',
        'message.created',
        'conversation.updated'
      ];
      eventTypes.forEach(eventType => {
        const handler = createEventHandler(eventType);
        channel.bind(eventType, handler);
        this.eventHandlers.get(channelName)!.set(eventType, handler);
      });
      
      // Also bind to channel subscription success and error
      channel.bind('pusher:subscription_succeeded', () => {
        // Subscription succeeded
      });
      
      channel.bind('pusher:error', () => {
        // Channel error (silent)
      });
    }

    // Return unsubscribe function for this specific callback
    return () => {
      const callbacks = this.callbacks.get(channelName);
      if (callbacks) {
        callbacks.delete(onEvent);
        if (callbacks.size === 0) {
          // No more callbacks, unsubscribe from channel completely
          const channel = this.channels.get(channelName);
          if (channel) {
            // Unbind all event handlers
            const eventHandlers = this.eventHandlers.get(channelName);
            if (eventHandlers) {
              const eventTypes = [
                'organization-event', 
                'notification', 
                'NotificationCreated', 
                'notification.created',
                'chat.message',
                'message.created',
                'conversation.updated'
              ];
              eventTypes.forEach(eventType => {
                const handler = eventHandlers.get(eventType);
                if (handler) {
                  channel.unbind(eventType, handler);
                }
              });
              this.eventHandlers.delete(channelName);
            }
            // Unsubscribe from channel
            this.pusher!.unsubscribe(channelName);
            this.channels.delete(channelName);
          }
        }
      }
    };
  }

  /**
   * Unsubscribe from organization channel (removes all callbacks)
   * @deprecated Use the unsubscribe function returned by subscribe() instead
   */
  unsubscribe(organizationId: number): void {
    if (!this.pusher) return;

    const channelName = `organization.${organizationId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      // Unbind all event handlers
      const eventHandlers = this.eventHandlers.get(channelName);
      if (eventHandlers) {
        const eventTypes = [
          'organization-event', 
          'notification', 
          'NotificationCreated', 
          'notification.created',
          'chat.message',
          'message.created',
          'conversation.updated'
        ];
        eventTypes.forEach(eventType => {
          const handler = eventHandlers.get(eventType);
          if (handler) {
            channel.unbind(eventType, handler);
          }
        });
        this.eventHandlers.delete(channelName);
      }
      
      // Remove all callbacks
      this.callbacks.delete(channelName);
      
      // Unsubscribe from channel
      this.pusher.unsubscribe(channelName);
      this.channels.delete(channelName);
      
      // Unsubscribed from channel
    }
  }

  /**
   * Disconnect Pusher
   */
  disconnect(): void {
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
      this.channels.clear();
    }
  }

  /**
   * Check if Pusher is connected
   */
  isConnected(): boolean {
    return this.pusher?.connection?.state === 'connected';
  }
}

export const pusherService = new PusherService();

