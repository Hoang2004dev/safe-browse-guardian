# SafeBrowse Guardian

A Chrome extension to protect users from malicious links, phishing, and tracking scripts.

## Setup
1. Clone this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" and click "Load unpacked".
4. Select the `SafeBrowseGuardian` folder.

## Features
- Blocks known malicious URLs.
- Warns users before navigating to potentially dangerous links.
- Provides a popup UI for managing settings.

## Development
- Update `background.js` to integrate Google Safe Browsing API.
- Enhance `content.js` for better link detection.
- Expand `popup.js` for blacklist/whitelist management.