// ==UserScript==
// @name Suno Feature Toggler
// @namespace https://suno.com/
// @version 2.0.0
// @description Toggle experimental Suno features - agentic-simple, VIP, B-Side/Orpheus
// @author User
// @match https://suno.com/*
// @match https://*.suno.com/*
// @grant unsafeWindow
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_registerMenuCommand
// @grant GM_unregisterMenuCommand
// @run-at document-start
// @connect studio-api.prod.suno.com
// @connect s.prod.suno.com
// ==/UserScript==

(function() {
'use strict';

const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

const FEATURE_GATES = {
  'agentic-simple': { name: 'Agentic Song Creator', default: false, enabled: false },
  'stack-ui': { name: 'Stack UI Mode', default: false, enabled: false },
  'decks-in-stack-mode': { name: 'Decks in Stack Mode', default: false, enabled: false },
  'web-v5-promo': { name: 'V5 Promo Banner', default: false, enabled: false },
  'sample': { name: 'Sample Feature', default: true, enabled: true },
  'mashup-ui': { name: 'Mashup UI', default: true, enabled: true },
  'create-sounds': { name: 'Create Sounds', default: true, enabled: true },
  'gen-video-covers': { name: 'Video Covers', default: true, enabled: true },
  'web-hooks-2025': { name: 'Hooks Feature', default: true, enabled: true },
  'web-theme-selector': { name: 'Theme Selector', default: true, enabled: true },
  'voices-ui': { name: 'Voices UI', default: true, enabled: true },
  'web-omniplayer': { name: 'Omni Player', default: true, enabled: true },
  'simple-remix-ui': { name: 'Simple Remix UI', default: true, enabled: true },
  'multi-sample': { name: 'Multi Sample', default: true, enabled: true },
  'vip-profile-aura': { name: 'VIP Profile Aura', default: false, enabled: false }
};

let enabledGates = {};
let menuIds = {};

function load() {
  try {
    const saved = GM_getValue('suno_enabledGates');
    if (saved) enabledGates = JSON.parse(saved);
  } catch (e) {}
  Object.keys(FEATURE_GATES).forEach(gate => {
    if (enabledGates[gate] === undefined) {
      enabledGates[gate] = FEATURE_GATES[gate].default;
    }
  });
}

function save() {
  GM_setValue('suno_enabledGates', JSON.stringify(enabledGates));
}

function updateMenu() {
  Object.keys(FEATURE_GATES).forEach(gate => {
    const config = FEATURE_GATES[gate];
    const isEnabled = enabledGates[gate];
    const label = `${config.name}: ${isEnabled ? 'ON' : 'OFF'}`;
    
    if (menuIds[gate]) {
      GM_unregisterMenuCommand(menuIds[gate]);
    }
    menuIds[gate] = GM_registerMenuCommand(label, () => {
      enabledGates[gate] = !enabledGates[gate];
      save();
      updateMenu();
      console.log(`[Suno Toggler] ${gate} = ${enabledGates[gate]}`);
    });
  });
}

load();

const originalFetch = win.fetch;
win.fetch = async function(...args) {
  const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
  const response = await originalFetch.apply(this, args);
  const clone = response.clone();

  if (url.includes('s.prod.suno.com/v1/initialize') || url.includes('s.prod.suno.com/v1/rgstr')) {
    try {
      const data = await clone.json();
      if (data.dynamic_configs) {
        Object.keys(enabledGates).forEach(gate => {
          data.dynamic_configs[gate] = {
            value: enabledGates[gate],
            gateValue: enabledGates[gate] ? 'true' : 'false'
          };
        });
        console.log('[Suno Toggler] Modified Statsig initialize:', Object.keys(enabledGates).filter(g => enabledGates[g]));
      }
      return new Response(JSON.stringify(data), { status: response.status, headers: response.headers });
    } catch (e) {}
  }

  if (url.includes('/api/statsig/experiment/')) {
    try {
      const data = await clone.json();
      if (data.data) {
        Object.keys(enabledGates).forEach(gate => {
          if (enabledGates[gate]) {
            data.data[gate] = true;
          }
        });
        if (enabledGates['agentic-simple']) {
          data.data.orpheus_is_enabled = true;
          data.data.orpheus_is_auto_mode = true;
          data.data.orpheus_is_canvas_enabled = true;
          data.data.orpheus_default_to_chat = true;
        }
        console.log('[Suno Toggler] Modified Statsig experiment');
        return new Response(JSON.stringify(data), { status: 200, headers: response.headers });
      }
    } catch (e) {}
  }

  if (url.includes('/api/billing/info/')) {
    try {
      const data = await clone.json();
      data.is_active = true;
      data.credits = 999999;
      data.total_credits_left = 999999;
      data.is_vip = true;
      if (data.plan) {
        data.plan.plan_key = "premier";
        data.plan.name = "Premier Plan";
        data.plan.level = 30;
      }
      console.log('[Suno Toggler] Spoofed billing');
      return new Response(JSON.stringify(data), { status: 200, headers: response.headers });
    } catch (e) {}
  }

  if (url.includes('s.prod.suno.com/v1/events') || url.includes('m-stratovibe')) {
    try {
      const data = await clone.json();
      if (data.events) {
        data.events = data.events.map(event => {
          if (event.eventName === 'statsig::gate_exposure' && event.metadata?.gate) {
            const gateName = event.metadata.gate;
            if (enabledGates[gateName] !== undefined) {
              event.metadata.gateValue = enabledGates[gateName] ? 'true' : 'false';
              event.metadata.ruleID = 'user_override';
            }
          }
          return event;
        });
      }
      return new Response(JSON.stringify(data), { status: response.status, headers: response.headers });
    } catch (e) {
      return response;
    }
  }

  return response;
};

const checkStatsig = setInterval(() => {
  if (win.statsig) {
    clearInterval(checkStatsig);
    const origCheck = win.statsig.checkGate;
    win.statsig.checkGate = function(gateName) {
      if (enabledGates[gateName] !== undefined) {
        console.log(`[Suno Toggler] SDK checkGate "${gateName}" -> ${enabledGates[gateName]}`);
        return enabledGates[gateName];
      }
      return origCheck.apply(this, arguments);
    };
    console.log('[Suno Toggler] Statsig SDK hooked');
  }
}, 100);
setTimeout(() => clearInterval(checkStatsig), 10000);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateMenu);
} else {
  updateMenu();
}

console.log('[Suno Toggler] Userscript initialized - use Tampermonkey menu to toggle features');
})();
