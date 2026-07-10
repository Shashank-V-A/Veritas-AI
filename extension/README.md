# Veritas AI Chrome Extension

Manifest V3 extension for quick credibility verification.

## Features

- Context menu: **Verify with Veritas** on any page or text selection
- Popup: verify the current page or selected text

## Load unpacked

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select this `extension/` folder

## Configuration

Set the Veritas app URL in the popup (default `http://localhost:5173`). Verification opens `/app` with a `q` (text) or `url` query parameter.

## Icons

Place PNG icons at `icons/icon16.png`, `icons/icon48.png`, and `icons/icon128.png`, or update `manifest.json` to remove icon references for local dev.
