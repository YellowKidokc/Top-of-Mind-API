export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || ''
export const EMMA_ENGINE_URL = import.meta.env.VITE_EMMA_ENGINE_URL || API_BASE_URL

export const EMMA_API = EMMA_ENGINE_URL ? `${EMMA_ENGINE_URL}/api/chat` : '/api/chat'
export const KB_ROOT = import.meta.env.VITE_KB_ROOT || ''
