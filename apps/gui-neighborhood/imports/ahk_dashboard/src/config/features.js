export const ENABLE_BACKEND_FEATURES =
  import.meta.env.VITE_ENABLE_BACKEND_FEATURES === 'true'

export const ENABLE_EMMA_CHAT =
  ENABLE_BACKEND_FEATURES &&
  import.meta.env.VITE_ENABLE_EMMA_CHAT !== 'false'
