// src/ai/taskAgent.js
// AI Task Orchestration Layer v0.1
// Enables AI Co-Pilot to create, update, and manage strategic tasks

/**
 * Generate unique task ID in format T-XXXX
 */
function generateTaskId() {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `T-${timestamp}${random}`;
}

/**
 * Validate task data structure
 */
function validateTask(task) {
  const required = ['id', 'title', 'status'];
  for (const field of required) {
    if (!task[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  const validStatuses = ['pending', 'in-progress', 'done', 'blocked'];
  if (!validStatuses.includes(task.status)) {
    throw new Error(`Invalid status: ${task.status}. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  return true;
}

/**
 * Create a new task via AI Co-Pilot
 * @param {string} title - Task title
 * @param {string} projectId - Associated project ID (e.g., 'qvan', 'ev-logistics')
 * @param {string} priority - 'high', 'medium', or 'low'
 * @param {string} dueDate - ISO date string (YYYY-MM-DD)
 * @param {string} description - Optional task description
 * @returns {Promise<Object>} Created task object
 */
export async function createTask(title, projectId = null, priority = 'medium', dueDate = null, description = '') {
  try {
    console.log('🤖 AI Co-Pilot: Creating new task...', { title, projectId, priority, dueDate });
    
    const taskId = generateTaskId();
    const now = new Date().toISOString();
    
    const newTask = {
      id: taskId,
      title: title.trim(),
      projectId: projectId || 'general',
      priority: priority.toLowerCase(),
      status: 'pending',
      due: dueDate,
      description: description || '',
      created_by: 'AI Co-Pilot',
      created_at: now,
      updated_at: now,
      notes: []
    };
    
    // Validate before sending
    validateTask(newTask);
    
    // Send to backend API
    const response = await fetch('/api/save-roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        task: newTask
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${error}`);
    }
    
    const result = await response.json();
    
    // Log the action
    await logTaskAction({
      taskId,
      action: 'create',
      transcript: `Create task: ${title}`,
      timestamp: now,
      ai_confidence: 100,
      result: 'success',
      details: newTask
    });
    
    console.log('✅ Task created successfully:', taskId);
    return { success: true, task: newTask };
    
  } catch (error) {
    console.error('❌ Failed to create task:', error);
    
    // Log failure
    await logTaskAction({
      taskId: 'unknown',
      action: 'create',
      transcript: `Create task: ${title}`,
      timestamp: new Date().toISOString(),
      ai_confidence: 0,
      result: 'error',
      error: error.message
    });
    
    return { success: false, error: error.message };
  }
}

/**
 * Update task status
 * @param {string} taskId - Task ID to update
 * @param {string} status - New status ('pending', 'in-progress', 'done', 'blocked')
 * @returns {Promise<Object>} Update result
 */
export async function updateTaskStatus(taskId, status) {
  try {
    console.log('🤖 AI Co-Pilot: Updating task status...', { taskId, status });
    
    const validStatuses = ['pending', 'in-progress', 'done', 'blocked'];
    if (!validStatuses.includes(status.toLowerCase())) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    const now = new Date().toISOString();
    
    const response = await fetch('/api/save-roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        taskId,
        updates: {
          status: status.toLowerCase(),
          updated_at: now,
          updated_by: 'AI Co-Pilot'
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${error}`);
    }
    
    const result = await response.json();
    
    // Log the action
    await logTaskAction({
      taskId,
      action: 'update_status',
      transcript: `Update ${taskId} to ${status}`,
      timestamp: now,
      ai_confidence: 100,
      result: 'success',
      details: { status }
    });
    
    console.log('✅ Task status updated:', taskId, '→', status);
    return { success: true, taskId, status };
    
  } catch (error) {
    console.error('❌ Failed to update task:', error);
    
    await logTaskAction({
      taskId,
      action: 'update_status',
      transcript: `Update ${taskId} to ${status}`,
      timestamp: new Date().toISOString(),
      ai_confidence: 0,
      result: 'error',
      error: error.message
    });
    
    return { success: false, error: error.message };
  }
}

/**
 * Append a note/comment to a task
 * @param {string} taskId - Task ID
 * @param {string} note - Note text to append
 * @returns {Promise<Object>} Append result
 */
export async function appendNote(taskId, note) {
  try {
    console.log('🤖 AI Co-Pilot: Adding note to task...', { taskId, note });
    
    if (!note || note.trim().length === 0) {
      throw new Error('Note cannot be empty');
    }
    
    const now = new Date().toISOString();
    
    const noteEntry = {
      text: note.trim(),
      added_by: 'AI Co-Pilot',
      timestamp: now
    };
    
    const response = await fetch('/api/save-roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'append',
        taskId,
        note: noteEntry
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${error}`);
    }
    
    const result = await response.json();
    
    // Log the action
    await logTaskAction({
      taskId,
      action: 'append_note',
      transcript: `Add note to ${taskId}: ${note}`,
      timestamp: now,
      ai_confidence: 100,
      result: 'success',
      details: { note }
    });
    
    console.log('✅ Note added to task:', taskId);
    return { success: true, taskId, note: noteEntry };
    
  } catch (error) {
    console.error('❌ Failed to add note:', error);
    
    await logTaskAction({
      taskId,
      action: 'append_note',
      transcript: `Add note to ${taskId}: ${note}`,
      timestamp: new Date().toISOString(),
      ai_confidence: 0,
      result: 'error',
      error: error.message
    });
    
    return { success: false, error: error.message };
  }
}

/**
 * Log task action to task-log.json
 * @param {Object} logEntry - Log entry data
 */
async function logTaskAction(logEntry) {
  try {
    const response = await fetch('/api/log-task-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    });
    
    if (!response.ok) {
      console.warn('⚠️ Failed to log task action:', await response.text());
    }
  } catch (error) {
    console.warn('⚠️ Task action logging failed:', error);
    // Don't throw - logging failures shouldn't break task operations
  }
}

/**
 * Get recent AI task operations from log
 * @param {number} limit - Number of recent entries to retrieve
 * @returns {Promise<Array>} Recent task log entries
 */
export async function getRecentTaskLog(limit = 5) {
  try {
    const response = await fetch(`/api/get-task-log?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch task log');
    }
    const data = await response.json();
    return data.logs || [];
  } catch (error) {
    console.error('❌ Failed to get task log:', error);
    return [];
  }
}

/**
 * Parse natural language command to extract task details
 * @param {string} command - Natural language command
 * @returns {Object} Parsed task details
 */
export function parseTaskCommand(command) {
  const cmd = command.toLowerCase();
  
  // Extract task title (common patterns)
  let title = command;
  
  // Remove action words
  title = title.replace(/^(create|add|make|new)\s+(task|milestone|todo)\s*/i, '');
  title = title.replace(/\s+(for|in|on)\s+\w+\s*project$/i, ''); // Remove project suffix
  
  // Extract project ID
  let projectId = 'general';
  const projectMatch = cmd.match(/(?:for|in|on)\s+(qvan|q-van|ev|ev-logistics|wow|wow-mena|dual|reem)\s*project/i);
  if (projectMatch) {
    const proj = projectMatch[1].toLowerCase();
    projectId = proj.includes('qvan') || proj.includes('q-van') ? 'qvan' :
                proj.includes('ev') ? 'ev-logistics' :
                proj.includes('wow') ? 'wow-mena' :
                proj.includes('dual') ? 'dual-vanaja' :
                proj.includes('reem') ? 'reem-residences' : 'general';
  }
  
  // Extract priority
  let priority = 'medium';
  if (cmd.includes('high priority') || cmd.includes('urgent') || cmd.includes('critical')) {
    priority = 'high';
  } else if (cmd.includes('low priority') || cmd.includes('minor')) {
    priority = 'low';
  }
  
  // Extract due date (simple patterns)
  let dueDate = null;
  const dateMatch = cmd.match(/(?:due|by|before)\s+(today|tomorrow|next week|this week)/i);
  if (dateMatch) {
    const dateStr = dateMatch[1].toLowerCase();
    const today = new Date();
    if (dateStr === 'today') {
      dueDate = today.toISOString().split('T')[0];
    } else if (dateStr === 'tomorrow') {
      today.setDate(today.getDate() + 1);
      dueDate = today.toISOString().split('T')[0];
    } else if (dateStr === 'next week') {
      today.setDate(today.getDate() + 7);
      dueDate = today.toISOString().split('T')[0];
    } else if (dateStr === 'this week') {
      today.setDate(today.getDate() + 3);
      dueDate = today.toISOString().split('T')[0];
    }
  }
  
  return {
    title: title.trim(),
    projectId,
    priority,
    dueDate
  };
}

export default {
  createTask,
  updateTaskStatus,
  appendNote,
  getRecentTaskLog,
  parseTaskCommand
};
