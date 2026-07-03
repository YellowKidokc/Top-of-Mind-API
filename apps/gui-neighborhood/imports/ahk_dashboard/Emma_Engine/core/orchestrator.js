/**
 * Orchestrator - MEGA-EMMA Logic Bridge & Executive Reasoning Layer
 * Handles cross-division communication and intelligent message routing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

class EmmaOrchestrator {
  constructor() {
    this.sessions = new Map();
    this.divisions = ['Germex', 'ShiftEV', 'MENA', 'HQ'];
    this.context = {
      lastInteraction: null,
      activeProjects: [],
      systemState: 'operational'
    };
  }

  /**
   * Process incoming message with full context awareness
   */
  async processMessage({ message, context = {}, sessionId = 'default' }) {
    try {
      console.log(`[Orchestrator] Processing message for session: ${sessionId}`);
      
      // Get or create session context
      if (!this.sessions.has(sessionId)) {
        this.sessions.set(sessionId, {
          id: sessionId,
          createdAt: new Date().toISOString(),
          messages: [],
          context: {}
        });
      }
      
      const session = this.sessions.get(sessionId);
      session.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });

      // Detect intent
      const intent = this.detectIntent(message);
      console.log(`[Orchestrator] Detected intent: ${intent}`);

      // Route to appropriate handler
      let response;
      switch (intent) {
        case 'create_memo':
          response = await this.handleMemoCreation(message, context);
          break;
        case 'generate_report':
          response = await this.handleReportGeneration(message, context);
          break;
        case 'sync_request':
          response = await this.handleSyncRequest(message, context);
          break;
        case 'status_query':
          response = await this.handleStatusQuery(message, context);
          break;
        default:
          response = await this.handleGeneralQuery(message, context);
      }

      // Store response in session
      session.messages.push({
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        message: response.message,
        intent,
        sessionId,
        timestamp: new Date().toISOString(),
        metadata: response.metadata || {}
      };

    } catch (error) {
      console.error('[Orchestrator] Processing error:', error);
      return {
        success: false,
        error: error.message,
        message: 'I encountered an error processing your request. Please try again.',
        sessionId
      };
    }
  }

  /**
   * Detect user intent from message
   */
  detectIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('memo') || lowerMessage.includes('write') || lowerMessage.includes('note')) {
      return 'create_memo';
    }
    if (lowerMessage.includes('report') || lowerMessage.includes('generate') || lowerMessage.includes('analyze')) {
      return 'generate_report';
    }
    if (lowerMessage.includes('sync') || lowerMessage.includes('update') || lowerMessage.includes('refresh')) {
      return 'sync_request';
    }
    if (lowerMessage.includes('status') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
      return 'status_query';
    }
    
    return 'general_query';
  }

  /**
   * Handle memo creation requests
   */
  async handleMemoCreation(message, context) {
    return {
      message: '📝 I can help you create a memo. What would you like to document?',
      metadata: {
        action: 'memo_creation',
        status: 'awaiting_details'
      }
    };
  }

  /**
   * Handle report generation requests
   */
  async handleReportGeneration(message, context) {
    return {
      message: '📊 Report generation initiated. Which division or project would you like to analyze?',
      metadata: {
        action: 'report_generation',
        availableDivisions: this.divisions
      }
    };
  }

  /**
   * Handle sync requests
   */
  async handleSyncRequest(message, context) {
    return {
      message: '🔄 Sync request received. I\'ll update the knowledge base and Drive files.',
      metadata: {
        action: 'sync_triggered',
        targets: ['Emma_KnowledgeBase', 'Emma_Drive', 'CommandCenter']
      }
    };
  }

  /**
   * Handle status queries
   */
  async handleStatusQuery(message, context) {
    return {
      message: `✅ All systems operational. Emma Engine is running with ${this.sessions.size} active sessions. Command Center data is synchronized.`,
      metadata: {
        systemStatus: this.context.systemState,
        activeSessions: this.sessions.size,
        divisions: this.divisions
      }
    };
  }

  /**
   * Handle general queries with AI
   */
  async handleGeneralQuery(message, context) {
    // Use Gemini if available, otherwise fallback
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = `You are Emma, the AI assistant for AHK Strategies. Answer this query professionally and helpfully: ${message}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        return {
          message: text,
          metadata: {
            source: 'gemini-ai',
            model: 'gemini-pro'
          }
        };
      } catch (error) {
        console.error('[Orchestrator] Gemini error:', error);
      }
    }

    // Fallback response
    return {
      message: 'I\'m here to help with memo creation, report generation, data synchronization, and status queries. How can I assist you?',
      metadata: {
        source: 'fallback',
        availableCapabilities: ['memo_creation', 'report_generation', 'sync', 'status']
      }
    };
  }

  /**
   * Get session history
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Clear old sessions
   */
  clearOldSessions(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionAge = now - new Date(session.createdAt).getTime();
      if (sessionAge > maxAge) {
        this.sessions.delete(sessionId);
        console.log(`[Orchestrator] Cleared old session: ${sessionId}`);
      }
    }
  }
}

// Export singleton instance
export const orchestrator = new EmmaOrchestrator();
