// Set year
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// TODO: Replace with actual store URLs when available
// Example:
// const CHROME_URL = 'https://chrome.google.com/webstore/detail/xxxxxxxx';
// const FIREFOX_URL = 'https://addons.mozilla.org/firefox/addon/xxxxxxxx';
const CHROME_URL = '#';
const FIREFOX_URL = '#';

for (const id of ['btn-chrome', 'btn-chrome-2']) {
  const el = document.getElementById(id);
  if (el) el.href = CHROME_URL;
}
for (const id of ['btn-firefox', 'btn-firefox-2']) {
  const el = document.getElementById(id);
  if (el) el.href = FIREFOX_URL;
}
