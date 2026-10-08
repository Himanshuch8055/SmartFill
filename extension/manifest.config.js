// Manifest V3 using CRXJS define style (plain object export)
// Built files will map according to Vite entry points referenced in HTML and src/* files

export default {
  manifest_version: 3,
  name: "SmartFill",
  description: "Fill forms in one click from your saved profiles. Preview, undo, per-site rules. Your data never leaves your browser.",
  version: "1.0.0",
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
  // Content scripts on all pages power the widget, badge and field learning; no extra host permissions needed.
  permissions: ["storage", "activeTab", "contextMenus"],
  commands: {
    "fill-form": {
      suggested_key: { default: "Alt+Shift+F" },
      description: "Fill the form on this page"
    },
    "undo-fill": {
      suggested_key: { default: "Alt+Shift+Z" },
      description: "Undo the last fill"
    },
    "next-profile": {
      suggested_key: { default: "Alt+Shift+P" },
      description: "Switch to the next profile"
    }
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/index.js"],
      run_at: "document_idle",
      all_frames: true
    }
  ]
}
