// Placeholder for VAPI SDK
// This file is kept for backward compatibility but is no longer used
// The new api.service.ts should be used instead

console.warn("VAPI SDK is deprecated. Please use apiService instead.");

// Export a mock object to prevent breaking changes
export const vapi = {
  on: () => {},
  off: () => {},
  start: () => {},
  stop: () => {},
  isMuted: () => false,
  setMuted: () => {},
};