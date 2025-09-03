// Manifest V3 using CRXJS define style (plain object export)
// Built files will map according to Vite entry points referenced in HTML and src/* files

export default {
  manifest_version: 3,
  name: "SmartFill",
  description: "SmartFill Chrome extension (scaffold)",
  version: "0.0.1",
  icons: {
    16: "icons/icon16.png",
    32: "icons/icon32.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png",
    256: "icons/icon256.png",
    512: "icons/icon512.png"
  },
  browser_specific_settings: {
    gecko: {
      id: "himanshuch8055@gmail.com",
      strict_min_version: "128.0"
    }
  },
  applications: {
    gecko: {
      id: "himanshuch8055@gmail.com",
      strict_min_version: "128.0"
    }
  },
  action: {
    default_title: "SmartFill",
    default_popup: "popup.html",
    default_icon: {
      16: "icons/icon16.png",
      32: "icons/icon32.png",
      48: "icons/icon48.png",
      128: "icons/icon128.png",
      256: "icons/icon256.png",
      512: "icons/icon512.png"
    }
  },
  options_page: "options.html",
  background: {
    service_worker: "src/background.js"
  },
  permissions: ["storage", "activeTab", "scripting", "tabs"],
  host_permissions: [
    "http://localhost/*",
    "https://localhost/*",
    "http://127.0.0.1/*",
    "https://*/*",
    "http://*/*"
  ],
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/index.js"],
      run_at: "document_idle",
      all_frames: true
    }
  ]
}
