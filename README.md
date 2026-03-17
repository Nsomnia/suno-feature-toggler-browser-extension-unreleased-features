# Suno Feature Toggler

A Tampermonkey/Violentmonkey userscript for toggling experimental Suno features including the **agentic-simple** (orchestrator) conversational LLM song creator.

## Features

- **Toggle 30+ feature gates** including experimental/beta features
- **Auto-capture JWT tokens** from API requests
- **Import/Export configuration** for sharing settings
- **Persistent storage** - settings survive page reloads
- **Visual override indicators** - see which gates are modified
- **Draggable UI panel** - position anywhere on screen

## Installation

### Step 1: Install Userscript Manager
Install one of these browser extensions:
- [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
- [Violentmonkey](https://violentmonkey.github.io/)

### Step 2: Install the Script
1. Open Tampermonkey/Violentmonkey dashboard
2. Click "Create a new script"
3. Delete any existing content
4. Paste the contents of `suno-feature-toggler.user.js`
5. Save (Ctrl+S)

### Step 3: Use
1. Go to [suno.com](https://suno.com)
2. Click the 🎛️ floating button (bottom-right)
3. Toggle features on/off
4. **Reload the page** to apply changes

## Features Breakdown

### 🔬 Experimental Features (Beta)

| Gate | Description | Status |
|------|-------------|--------|
| `agentic-simple` | **Conversational LLM Song Creator (Orchestrator)** | Disabled by default |
| `stack-ui` | Alternative stack interface | Disabled |
| `decks-in-stack-mode` | Deck-based UI mode | Disabled |
| `web-v5-promo` | V5 model promotion | Disabled |

### ✅ Active Features

| Gate | Description |
|------|-------------|
| `sample` | Use any audio as seed |
| `mashup-ui` | Mashup functionality |
| `create-sounds` | Sound generation |
| `gen-video-covers` | Video cover generation |
| `web-hooks-2025` | Hooks/sample clips |
| `voices-ui` | Voice selection UI |
| `web-omniplayer` | Universal player |
| `multi-sample` | Multiple samples |
| `audio-upload-tag-editing` | Edit upload tags |

### 🔧 Internal/UI Settings

Various UI and internal feature flags for debugging.

## How It Works

### Interception Points

1. **Fetch API Interception** - Modifies Statsig initialization responses
2. **XHR Interception** - Captures authentication tokens
3. **Statsig SDK Override** - Overrides `checkGate()` and `getDynamicConfig()`

### Token Handling

- JWT tokens are automatically captured from API requests
- You can also manually paste a token in the UI
- Tokens are stored in localStorage for persistence

### Override Logic

Each gate has 3 states:
1. **Default** - Use Suno's original setting (no override)
2. **ON** - Force enable the feature
3. **OFF** - Force disable the feature

Click the toggle to cycle through states.

## Model Information

### Current Models (chirp series)

| Model Name | Version | Notes |
|------------|---------|-------|
| `chirp-crow` | v5 | Default V5 model |
| `chirp-chirp` | v5 | Alternative V5 model |

Both are v5 models used for generation.

## User Plan

Your captured data shows:
- **Plan:** `premier`
- Features like stems, personas, replace section, and Suno Studio should be available

## Eligible Discounts

From API data, there's a `harvard2025` discount slug detected - this may indicate available promotions.

## Export/Import

Use the Export/Import buttons to:
- Share your configuration with others
- Backup your settings
- Quickly enable known working configurations

## Troubleshooting

### Features not applying?
1. Make sure to **reload the page** after toggling
2. Check the browser console for `[Suno Toggler]` messages
3. Try clearing browser cache

### Token not captured?
1. Make sure you're logged in
2. Interact with the site (generate a song, navigate)
3. Or manually paste your JWT token

### UI not appearing?
1. Check Tampermonkey icon shows the script is active
2. Try refreshing the page
3. Check browser console for errors

## Security Note

This script modifies client-side feature gates only. Server-side validations may still enforce subscription requirements for premium features. The script does not bypass authentication or payment requirements.

## API Endpoint Reference

For your API project, here are key endpoints:

```
Base URL: https://studio-api.prod.suno.com

Authentication:
- Authorization: Bearer <JWT>
- Browser-Token: {"token":"<base64>"}
- Device-Id: <uuid>

Endpoints:
GET  /api/generate/concurrent-status
POST /api/tags/recommend
GET  /api/prompts/
GET  /api/prompts/suggestions
GET  /api/project/me
GET  /api/billing/info/
GET  /api/billing/eligible-discounts
GET  /api/clips/get_songs_by_ids
GET  /api/notification/v2
POST /api/user/user_config/
```

## Files

- `suno-feature-toggler.user.js` - Main userscript
- `README.md` - This file

## License

MIT
