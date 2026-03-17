# Suno Feature Discovery Report
## Unreleased & Experimental Features Identified from API Traffic

**Generated:** March 2026  
**Source:** API Sniffer Raw Data Analysis

---

## 🔥 Key Discovery: `agentic-simple` Feature Gate (Likely the Orchestrator)

### Most Promising Finding

The **`agentic-simple`** feature gate is currently **DISABLED** (`gateValue: false`, `ruleID: default`) for this user. This is the most likely candidate for the conversational LLM-based song creator (orchestrator) you mentioned.

**Evidence:**
```json
{
  "gate": "agentic-simple",
  "gateValue": "false",
  "ruleID": "default",
  "reason": "Network:Recognized"
}
```

### How to Potentially Enable

**Browser Extension Approach:**
The Statsig feature gates are controlled client-side. A browser extension could intercept and modify these responses:

1. **Intercept the Statsig initialize call** to `s.prod.suno.com/v1/initialize`
2. **Modify the gate values** to return `true` for `agentic-simple`
3. **Override the `checkGate` function** in the Statsig SDK

**Technical Implementation Notes:**
- The Statsig SDK is loaded from `s.prod.suno.com`
- Feature gates are checked via `statsig::gate_exposure` events
- Override `window.statsig.checkGate('agentic-simple')` to return `true`

---

## 🧪 Active Feature Gates (Currently Enabled)

These gates are **ACTIVE** and can be used to understand available features:

| Gate Name | Status | Notes |
|-----------|--------|-------|
| `sample` | `true` | Sample feature - use audio as seed |
| `mashup-ui` | `true` | Mashup functionality UI |
| `create-sounds` | `true` | Sound generation feature |
| `gen-video-covers` | `true` | Video cover generation |
| `web-hooks-2025` | `true` | Hooks feature (sample clips) |
| `web-theme-selector` | `true` | Theme selection |
| `sprig-surveys` | `true` (50%) | User survey system |
| `forced-age-verification` | `true` | Age verification requirement |
| `lazy-load-hcaptcha` | `true` | Captcha optimization |
| `artist-profiles-hooks` | `true` | Artist profile hooks |
| `enable-frontend-profile-pic-upload` | `true` | Profile picture uploads |
| `voices-ui` | `true` | Voice selection UI |

---

## 🚫 Disabled Feature Gates (Potential Beta Features)

These gates are **DISABLED** and may unlock unreleased features:

| Gate Name | Status | Potential Feature |
|-----------|--------|-------------------|
| `agentic-simple` | `false` | **Conversational LLM song creator (ORCHESTRATOR)** |
| `web-v5-promo` | `false` | v5 model promotion |
| `decks-in-stack-mode` | `false` | Stack/deck UI mode |
| `stack-ui` | `false` | Alternative stack interface |

---

## 📊 A/B Testing Experiments

### Active Experiment IDs

The system uses Statsig for A/B testing. Key experiments detected:

| Experiment ID | Occurrences | Notes |
|---------------|-------------|-------|
| `3134176511` | 12 | Most frequent experiment |
| `3327255428` | 8 | Active A/B test |
| `3289291442` | 8 | Active A/B test |
| `1648276868` | 8 | Active A/B test |
| `1409499154` | 8 | Active A/B test |
| `1187212704` | 8 | Active A/B test |
| `forked-onboarding` | 3 | Onboarding experiment |

### Onboarding Groups Detected
- `default`
- `welcome_and_profile_and_birthday`

---

## 🎵 Model Versions Available

| Model | Usage Count | Notes |
|-------|-------------|-------|
| `v5` | 471 | **Latest model** - "most advanced" |
| `v3.5` | 90 | Previous generation |
| `v4` | 30 | Intermediate version |
| `v4.5-all` | 5 | Full v4.5 capabilities |
| `v4.5` | 4 | Standard v4.5 |
| `v5-launch` | 8 | v5 launch promotions |
| `v4-promo` | 8 | v4 promotions |

**Pro/Premier Exclusive Models:**
- `v4.5-all` - Access to advanced v4.5 model
- `v5` - Latest and most advanced model (Pro/Premier)

---

## 🎤 Pro/Premier Features Identified

### Suno Studio Features
| Feature | Description | Plan Required |
|---------|-------------|---------------|
| **Stems** | Up to 12 stem separation | Pro/Premier |
| **Personas** | Reuse song's voice and style | Pro/Premier |
| **Replace Section** | Re-roll single lines or sections | Pro/Premier |
| **Remaster** | Upgrade quality to v4.5/v4 | Pro/Premier |
| **Longer Audio Upload** | Upload up to 8 minutes | Pro/Premier |
| **Suno Studio** | Full multitrack DAW | All (limited free) |

### Studio Features Enabled
```json
{
  "studio": true,
  "studio-cover-stem-cond": true,
  "studio-eq": true,
  "studio-clip-editor": true
}
```

---

## 🔗 API Endpoints Discovered

### Core Generation Endpoints
```
GET  /api/generate/concurrent-status  - Check generation queue status
POST /api/tags/recommend              - Get tag recommendations
GET  /api/prompts/                    - Get prompt suggestions
GET  /api/prompts/suggestions         - Prompt suggestions
```

### User & Project Endpoints
```
GET  /api/project/me                  - User's projects
GET  /api/project/default             - Default workspace
GET  /api/project/default/pinned-clips - Pinned clips
POST /api/user/user_config/           - User configuration
```

### Billing & Plans
```
GET  /api/billing/info/                       - Billing info
GET  /api/billing/eligible-discounts          - Available discounts
GET  /api/billing/usage-plan-faq/             - Plan FAQ
GET  /api/billing/usage-plan-descriptions/    - Plan descriptions
GET  /api/billing/usage-plan-web-table-comparison/ - Plan comparison
```

### Content & Feed
```
GET  /api/feed/v3                     - User feed
GET  /api/clips/get_songs_by_ids      - Get songs by IDs
GET  /api/notification/v2             - Notifications
GET  /api/notification/v2/badge-count - Notification count
```

### Statsig & Experiments
```
GET  /api/statsig/experiment/forked-onboarding - Onboarding experiment
```

---

## 🎯 Mashup & Hooks System

### Mashup Task Types
```json
{
  "task": "mashup_condition",
  "mashup_clip_ids": ["uuid1", "uuid2"],
  "can_remix": true,
  "is_remix": false,
  "priority": 10,
  "has_stem": false,
  "max_bpm": 136.36,
  "min_bpm": 115.38,
  "avg_bpm": 126.48,
  "key": "A_major"
}
```

### Hooks Sources
- `hooks_from_modal_recommendations_source`
- `hooks_from_clips_similar_to_listening_history_recommendations_source`
- `hooks_from_followed_users_recommendations_source`
- `hooks_from_liked_clips_recommendations_source`

---

## 🔐 Authentication Headers Required

To use the API directly, these headers are needed:

```http
Authorization: Bearer <JWT_TOKEN>
Browser-Token: {"token":"<BASE64_TIMESTAMP>"}
Device-Id: <UUID>
```

---

## 💡 Competitive Advantages Discovered

1. **`agentic-simple` Gate** - Conversational LLM song creator (BETA)
2. **Voice/Personas System** - Reuse voice styles across songs
3. **12-Stem Separation** - Advanced stem extraction
4. **Suno Studio** - Full multitrack DAW in browser
5. **Sample Feature** - Use any audio as seed
6. **Mashup System** - Combine multiple songs intelligently

---

## 🛠️ Browser Extension Implementation Guide

### Target: Enable `agentic-simple` (Orchestrator)

```javascript
// Content script approach
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  
  if (args[0].includes('s.prod.suno.com/v1/initialize')) {
    const text = await response.text();
    let data = JSON.parse(text);
    
    // Enable agentic-simple
    if (data.dynamic_configs) {
      data.dynamic_configs['agentic-simple'] = {
        value: true,
        gateValue: 'true'
      };
    }
    
    return new Response(JSON.stringify(data));
  }
  
  return response;
};
```

### Alternative: Statsig SDK Override

```javascript
// Override after page load
if (window.statsig) {
  const originalCheckGate = window.statsig.checkGate;
  window.statsig.checkGate = function(gateName) {
    if (gateName === 'agentic-simple') return true;
    return originalCheckGate.call(this, gateName);
  };
}
```

---

## 📝 Notes

- All feature gates are controlled via Statsig (s.prod.suno.com)
- Gate values can be overridden client-side for testing
- Some features require Pro/Premier subscription server-side
- API uses Clerk for authentication (auth.suno.com)
- Analytics tracked via Segment (m-stratovibe.prod.suno.com)

---

*This report is for educational purposes. Features may change without notice.*
