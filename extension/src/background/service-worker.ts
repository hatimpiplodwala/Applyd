import { extractTab } from "../lib/inject";

const MENU_ID = "applyd-save-job";
const PENDING_KEY = "pendingExtraction";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Save Job to Applyd",
    contexts: ["page", "link"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  const url = info.linkUrl || tab.url || "";
  try {
    const raw = await extractTab(tab.id, url);
    await chrome.storage.session.set({ [PENDING_KEY]: raw });
    // openPopup is supported in recent Chrome/Edge; fall back to a popup window.
    if (typeof chrome.action.openPopup === "function") {
      try {
        await chrome.action.openPopup();
        return;
      } catch {
        /* fall through to window */
      }
    }
    await chrome.windows.create({
      url: chrome.runtime.getURL("index.html"),
      type: "popup",
      width: 400,
      height: 620,
    });
  } catch {
    // Extraction failed (e.g. restricted page). Open the popup empty so the
    // user can still save manually.
    if (typeof chrome.action.openPopup === "function") {
      try {
        await chrome.action.openPopup();
        return;
      } catch {
        /* fall through to window */
      }
    }
    await chrome.windows.create({
      url: chrome.runtime.getURL("index.html"),
      type: "popup",
      width: 400,
      height: 620,
    });
  }
});
