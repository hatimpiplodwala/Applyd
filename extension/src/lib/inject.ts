import type { RawExtraction } from "./extract";

// Runs in the target page. Self-contained: no references to module scope.
function pageExtractor(): {
  title: string;
  bodyText: string;
  canonical: string | null;
  ogUrl: string | null;
} {
  const canonicalEl = document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  );
  const ogEl = document.querySelector<HTMLMetaElement>(
    'meta[property="og:url"]'
  );
  return {
    title: document.title || "",
    bodyText: document.body?.innerText ?? "",
    canonical: canonicalEl?.href || null,
    ogUrl: ogEl?.content || null,
  };
}

// Injects the extractor into a tab by id and returns a RawExtraction.
export async function extractTab(
  tabId: number,
  tabUrl: string
): Promise<RawExtraction> {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: pageExtractor,
  });
  const data = result.result as Omit<RawExtraction, "tabUrl">;
  return { ...data, tabUrl };
}

// Convenience wrapper for the active tab (used by the popup path).
export async function extractActiveTab(): Promise<RawExtraction> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) throw new Error("No active tab");
  return extractTab(tab.id, tab.url);
}
