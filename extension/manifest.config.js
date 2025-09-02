// Manifest V3 using CRXJS define style (plain object export)
// Built files will map according to Vite entry points referenced in HTML and src/* files

export default {
  manifest_version: 3,
  name: "SmartFill",
  description: "SmartFill Chrome extension (scaffold)",
  version: "0.0.1",
  action: {
    default_title: "SmartFill",
    default_popup: "popup.html"
  },
  options_page: "options.html",
  background: {
    service_worker: "src/background.js",
    type: "module"
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
