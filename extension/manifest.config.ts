import { defineManifest } from "@crxjs/vite-plugin";
import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

function hostPattern(url: string | undefined): string {
  try {
    return `${new URL(url ?? "").origin}/*`;
  } catch {
    return "https://applyd-api.onrender.com/*";
  }
}

export default defineManifest((env) => {
  const viteEnv = loadEnv(env.mode, here, "VITE_");
  return {
    manifest_version: 3,
    name: "Applyd — Save Job",
    version: "0.1.0",
    description:
      "Save the job posting you're viewing to Applyd, with details auto-filled by AI.",
    icons: {
      "16": "public/icons/icon16.png",
      "32": "public/icons/icon32.png",
      "48": "public/icons/icon48.png",
      "128": "public/icons/icon128.png",
    },
    action: {
      default_popup: "index.html",
      default_title: "Save Job to Applyd",
    },
    background: {
      service_worker: "src/background/service-worker.ts",
      type: "module",
    },
    permissions: ["storage", "activeTab", "scripting", "contextMenus"],
    host_permissions: [
      hostPattern(viteEnv.VITE_API_URL),
      hostPattern(viteEnv.VITE_SUPABASE_URL),
    ],
  };
});
