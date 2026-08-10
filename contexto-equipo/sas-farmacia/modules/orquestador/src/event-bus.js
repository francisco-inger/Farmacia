/**
 * Cross-Module Event Bus Engine
 * Handles publication, subscription, schema validation logging, and inter-module event propagation.
 */

export class EventBusEngine {
  constructor() {
    this.subscribers = new Map();
    this.eventLog = [];
    this.maxLogLength = 50;
    this.listeners = [];
  }

  /**
   * Subscribe a module handler to a specific event
   */
  subscribe(eventType, targetModule, handler) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType).push({ targetModule, handler });
  }

  /**
   * Register a general observer for UI/audit logs
   */
  onEventProcessed(callback) {
    this.listeners.push(callback);
  }

  /**
   * Publish an event to the bus
   */
  publish(event) {
    const timestamp = new Date().toISOString();
    const enrichedEvent = {
      ...event,
      published_at: timestamp,
      status: 'processed'
    };

    this.eventLog.unshift(enrichedEvent);
    if (this.eventLog.length > this.maxLogLength) {
      this.eventLog.pop();
    }

    const handlers = this.subscribers.get(event.event_type) || [];
    const triggeredModules = handlers.map(h => h.targetModule);

    handlers.forEach(({ handler }) => {
      try {
        handler(enrichedEvent);
      } catch (err) {
        console.error(`Error delivering event ${event.event_type} to module:`, err);
      }
    });

    // Notify UI observers
    this.listeners.forEach(cb => cb(enrichedEvent, triggeredModules));
    return enrichedEvent;
  }

  getRecentEvents() {
    return this.eventLog;
  }

  clearLogs() {
    this.eventLog = [];
  }
}
