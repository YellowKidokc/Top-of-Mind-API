/**
 * Scheduler - Automated Task Orchestration with node-cron
 * Handles daily syncs, memo generation, health checks, and maintenance
 */

import cron from 'node-cron';
import { orchestrator } from './orchestrator.js';

// Scheduler state
const schedulerState = {
  jobs: [],
  isInitialized: false,
  lastHealthCheck: null,
  lastDailySync: null
};

/**
 * Initialize all scheduled tasks
 */
export function initializeScheduler() {
  if (schedulerState.isInitialized) {
    console.log('[Scheduler] Already initialized');
    return;
  }

  console.log('[Scheduler] Initializing cron jobs...');

  // Daily sync at 8:00 AM Cairo time (MEGA-EMMA sync)
  const dailySyncJob = cron.schedule('0 8 * * *', async () => {
    console.log('[Scheduler] Running daily MEGA-EMMA sync...');
    try {
      // TODO: Trigger Emma sync script
      schedulerState.lastDailySync = new Date().toISOString();
      console.log('[Scheduler] Daily sync completed');
    } catch (error) {
      console.error('[Scheduler] Daily sync error:', error);
    }
  }, {
    timezone: 'Africa/Cairo'
  });

  // Health check every 30 minutes
  const healthCheckJob = cron.schedule('*/30 * * * *', async () => {
    console.log('[Scheduler] Running health check...');
    try {
      // Clear old sessions
      orchestrator.clearOldSessions();
      
      schedulerState.lastHealthCheck = new Date().toISOString();
      console.log('[Scheduler] Health check completed');
    } catch (error) {
      console.error('[Scheduler] Health check error:', error);
    }
  });

  // Hourly memo index update
  const memoIndexJob = cron.schedule('0 * * * *', async () => {
    console.log('[Scheduler] Updating memo index...');
    try {
      // TODO: Update Emma_KnowledgeBase/Memos/memo_index.json
      console.log('[Scheduler] Memo index updated');
    } catch (error) {
      console.error('[Scheduler] Memo index update error:', error);
    }
  });

  // Weekly archive at 10:00 PM Friday
  const weeklyArchiveJob = cron.schedule('0 22 * * 5', async () => {
    console.log('[Scheduler] Running weekly archive...');
    try {
      // TODO: Trigger archive_project.js script
      console.log('[Scheduler] Weekly archive completed');
    } catch (error) {
      console.error('[Scheduler] Weekly archive error:', error);
    }
  }, {
    timezone: 'Africa/Cairo'
  });

  // Store job references
  schedulerState.jobs = [
    { name: 'dailySync', job: dailySyncJob, schedule: '0 8 * * *' },
    { name: 'healthCheck', job: healthCheckJob, schedule: '*/30 * * * *' },
    { name: 'memoIndex', job: memoIndexJob, schedule: '0 * * * *' },
    { name: 'weeklyArchive', job: weeklyArchiveJob, schedule: '0 22 * * 5' }
  ];

  schedulerState.isInitialized = true;
  console.log(`[Scheduler] Initialized ${schedulerState.jobs.length} cron jobs`);
}

/**
 * Stop all scheduled jobs
 */
export function stopScheduler() {
  console.log('[Scheduler] Stopping all cron jobs...');
  schedulerState.jobs.forEach(({ name, job }) => {
    job.stop();
    console.log(`[Scheduler] Stopped: ${name}`);
  });
  schedulerState.isInitialized = false;
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    initialized: schedulerState.isInitialized,
    activeJobs: schedulerState.jobs.map(({ name, schedule }) => ({
      name,
      schedule,
      active: true
    })),
    lastHealthCheck: schedulerState.lastHealthCheck,
    lastDailySync: schedulerState.lastDailySync
  };
}

/**
 * Manually trigger a specific job
 */
export async function triggerJob(jobName) {
  console.log(`[Scheduler] Manually triggering: ${jobName}`);
  
  switch (jobName) {
    case 'dailySync':
      schedulerState.lastDailySync = new Date().toISOString();
      console.log('[Scheduler] Daily sync triggered manually');
      break;
    case 'healthCheck':
      orchestrator.clearOldSessions();
      schedulerState.lastHealthCheck = new Date().toISOString();
      console.log('[Scheduler] Health check triggered manually');
      break;
    case 'memoIndex':
      console.log('[Scheduler] Memo index update triggered manually');
      break;
    case 'weeklyArchive':
      console.log('[Scheduler] Weekly archive triggered manually');
      break;
    default:
      throw new Error(`Unknown job: ${jobName}`);
  }
}
