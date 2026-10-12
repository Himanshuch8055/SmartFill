// Manifest V3 using CRXJS define style (plain object export)
// Built files will map according to Vite entry points referenced in HTML and src/* files

export default {
  manifest_version: 3,
  name: "__MSG_appName__",
  description: "__MSG_appDesc__",
  default_locale: "en",
  version: "1.1.0",
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
    default_title: "__MSG_actionTitle__",
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
      description: "__MSG_cmdFill__"
    },
    "undo-fill": {
      suggested_key: { default: "Alt+Shift+Z" },
      description: "__MSG_cmdUndo__"
    },
    "next-profile": {
      suggested_key: { default: "Alt+Shift+P" },
      description: "__MSG_cmdNextProfile__"
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
