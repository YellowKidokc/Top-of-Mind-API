/**
 * Google Drive Configuration for Emma Ecosystem
 * UPDATED: Single profile configuration (ashraf.kahoush@gmail.com)
 * Root: /GoogleDrive/MyDrive/AHK Profile/Emma/
 */

export const GOOGLE_CREDENTIALS = {
  personal: {
    client_email: "ashraf.kahoush@gmail.com",
    driveFolder: "AHK Profile",
    rootPath: "/GoogleDrive/MyDrive/AHK Profile/Emma/",
    permission: "owner",
    description: "Personal Google Drive - Primary Emma workspace"
  }
};

/**
 * Emma folder structure in /AHK Profile/Emma/
 */
export const EMMA_FOLDER_STRUCTURE = {
  root: "AHK Profile/Emma",
  subfolders: [
    {
      name: "KnowledgeBase",
      description: "Core knowledge, facts, and reference materials",
      syncFrequency: "daily",
      readWrite: true
    },
    {
      name: "Logs",
      description: "Activity logs, analysis history, and interaction records",
      syncFrequency: "hourly",
      readWrite: true
    },
    {
      name: "Dictionaries",
      description: "Terminology, acronyms, and domain-specific language",
      syncFrequency: "realtime",
      readWrite: true
    },
    {
      name: "Archives",
      description: "Historical data and deprecated materials",
      syncFrequency: "weekly",
      readWrite: true
    },
    {
      name: "Outputs",
      description: "PRIMARY OUTPUT FOLDER - Generated reports, analysis results",
      syncFrequency: "realtime",
      readWrite: true,
      primary: true
    }
  ]
};

/**
 * OAuth2 configuration for Google Drive API
 */
export const OAUTH_CONFIG = {
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata.readonly'
  ],
  redirect_uri: 'http://localhost:4000/oauth2callback'
};

/**
 * Sync settings for Emma
 */
export const SYNC_SETTINGS = {
  autoSync: true,
  syncInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'text/plain',
    'text/markdown',
    'application/json'
  ],
  excludePatterns: [
    /^~\$/,  // Temp files
    /\.tmp$/,
    /^\./    // Hidden files
  ]
};

/**
 * Get environment variables for Google Drive authentication
 */
export function getGoogleEnv() {
  // Check if running in Node.js (backend) or browser (frontend)
  const isNode = typeof window === 'undefined';
  
  if (isNode) {
    // Node.js environment - use process.env directly
    return {
      apiKey: process.env.GOOGLE_API_KEY || process.env.GOOGLE_DRIVE_API_KEY,
      personalRefreshToken: process.env.GOOGLE_PERSONAL_REFRESH_TOKEN,
      workRefreshToken: process.env.GOOGLE_WORK_REFRESH_TOKEN,
      clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET
    };
  } else {
    // Browser environment - use import.meta.env (Vite)
    return {
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
      personalRefreshToken: import.meta.env.VITE_GOOGLE_PERSONAL_REFRESH_TOKEN,
      workRefreshToken: import.meta.env.VITE_GOOGLE_WORK_REFRESH_TOKEN,
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET
    };
  }
}
