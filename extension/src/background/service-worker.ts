import { extractTab } from "../lib/inject";
import { PENDING_EXTRACTION_KEY } from "../lib/constants";

const MENU_ID = "applyd-save-job";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Save Job to Applyd",
    contexts: ["page", "link"],
  });
});

// openPopup is supported in recent Chrome/Edge; fall back to a popup window
// when it's unavailable or rejects (e.g. no active window).
async function openPopupOrWindow(): Promise<void> {
  if (typeof chrome.action.openPopup === "function") {
    try {
      await chrome.action.openPopup();
      return;
    } catch {
      /* fall through to a popup window */
    }
  }
  await chrome.windows.create({
    url: chrome.runtime.getURL("index.html"),
    type: "popup",
    width: 296,
    height: 476,
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  const url = info.linkUrl || tab.url || "";
  try {
    const raw = await extractTab(tab.id, url);
    await chrome.storage.session.set({ [PENDING_EXTRACTION_KEY]: raw });
  } catch {
    // Extraction failed (e.g. a restricted page). Open the popup empty so the
    // user can still save manually.
  }
  await openPopupOrWindow();
});
