// Stub the chrome extension APIs that are not available in the jsdom test environment.
// This prevents unhandled rejections from the supabase chrome.storage adapter
// when the GoTrue client initialises during test collection.
(globalThis as Record<string, unknown>).chrome = {
  storage: {
    local: {
      get: (_key: string) => Promise.resolve({}),
      set: (_items: object) => Promise.resolve(),
      remove: (_key: string) => Promise.resolve(),
    },
  },
};
