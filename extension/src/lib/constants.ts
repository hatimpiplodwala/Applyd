// Session-storage key for the extraction the context-menu path hands off to
// the popup. Shared contract: the service worker writes it, the popup reads it.
export const PENDING_EXTRACTION_KEY = "pendingExtraction";
