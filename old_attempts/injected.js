(function() {
  'use strict';

  const FEATURE_GATES = {
    'agentic-simple': { name: 'Agentic Song Creator', default: false },
    'stack-ui': { name: 'Stack UI Mode', default: false },
    'decks-in-stack-mode': { name: 'Decks in Stack Mode', default: false },
    'web-v5-promo': { name: 'V5 Promo Banner', default: false },
    'sample': { name: 'Sample Feature', default: true },
    'mashup-ui': { name: 'Mashup UI', default: true },
    'create-sounds': { name: 'Create Sounds', default: true },
    'gen-video-covers': { name: 'Video Covers', default: true },
    'web-hooks-2025': { name: 'Hooks Feature', default: true },
    'web-theme-selector': { name: 'Theme Selector', default: true },
    'sprig-surveys': { name: 'User Surveys', default: true },
    'forced-age-verification': { name: 'Age Verification', default: true },
    'lazy-load-hcaptcha': { name: 'Lazy Captcha', default: true },
    'artist-profiles-hooks': { name: 'Artist Profile Hooks', default: true },
    'enable-frontend-profile-pic-upload': { name: 'Profile Pic Upload', default: true },
    'voices-ui': { name: 'Voices UI', default: true },
    'web-omniplayer': { name: 'Omni Player', default: true },
    'simple-remix-ui': { name: 'Simple Remix UI', default: true },
    'multi-sample': { name: 'Multi Sample', default: true },
    'logged-in-song-page-v2': { name: 'Song Page V2', default: true },
    'audio-upload-tag-editing': { name: 'Audio Tag Editing', default: true },
    'enable-sharelist-and-share-notifications': { name: 'Share Notifications', default: true },
    'vip-profile-aura': { name: 'VIP Profile Aura', default: false },
    'web-clip-preview-toggle': { name: 'Clip Preview Toggle', default: true },
    'collapsible-library-rows': { name: 'Collapsible Library', default: true },
    'defer-account-deletions': { name: 'Defer Deletions', default: true },
    'can-delete-account': { name: 'Can Delete Account', default: true },
    'anti-abuse-checks-enabled': { name: 'Anti Abuse Checks', default: true },
    'use_tanstack_single_clip': { name: 'TanStack Single Clip', default: true },
    'use_tanstack_mutations': { name: 'TanStack Mutations', default: true }
  };

  let enabledGates = {};

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data.type === 'SUNO_TOGGLER_CONFIG') {
      enabledGates = event.data.enabledGates || {};
      console.log('[Suno Toggler] Received config:', enabledGates);
    }
  });

  window.postMessage({ type: 'SUNO_TOGGLER_READY' }, '*');

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
    const response = await originalFetch.apply(this, args);
    const clone = response.clone();

    if (url.includes('s.prod.suno.com/v1/initialize') || url.includes('s.prod.suno.com/v1/rgstr')) {
      try {
        const data = await clone.json();
        if (data.dynamic_configs) {
          Object.keys(enabledGates).forEach(gate => {
            if (enabledGates[gate] !== null && enabledGates[gate] !== undefined) {
              data.dynamic_configs[gate] = {
                value: enabledGates[gate],
                gateValue: enabledGates[gate] ? 'true' : 'false'
              };
              console.log(`[Suno Toggler] Gate "${gate}" set to ${enabledGates[gate]}`);
            }
          });
        }
        return new Response(JSON.stringify(data), { status: response.status, headers: response.headers });
      } catch (e) {
        console.error('[Suno Toggler] Failed to modify Statsig:', e);
      }
    }

    if (url.includes('/api/statsig/experiment/')) {
      try {
        const data = await clone.json();
        if (data.data) {
          if (data.data.hasOwnProperty('orpheus_is_enabled')) {
            data.data.orpheus_is_enabled = true;
            data.data.orpheus_is_auto_mode = true;
            data.data.orpheus_is_canvas_enabled = true;
            data.data.orpheus_default_to_chat = true;
          }
          Object.keys(enabledGates).forEach(gate => {
            if (enabledGates[gate] !== null && enabledGates[gate] !== undefined) {
              data.data[gate] = enabledGates[gate];
            }
          });
          console.log('[Suno Toggler] Spoofed Statsig Experiment:', data);
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
          data.plan.name = "Premier Plan (OpSec Override)";
          data.plan.level = 30;
        }
        console.log('[Suno Toggler] Spoofed Billing/VIP Info:', data);
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
              if (enabledGates[gateName] !== undefined && enabledGates[gateName] !== null) {
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
    if (window.statsig) {
      clearInterval(checkStatsig);
      const originalCheckGate = window.statsig.checkGate;
      window.statsig.checkGate = function(gateName, options) {
        if (enabledGates[gateName] !== undefined && enabledGates[gateName] !== null) {
          console.log(`[Suno Toggler] SDK Gate "${gateName}" overridden to: ${enabledGates[gateName]}`);
          return enabledGates[gateName];
        }
        return originalCheckGate.call(this, gateName, options);
      };

      const originalGetDynamicConfig = window.statsig.getDynamicConfig;
      window.statsig.getDynamicConfig = function(configName, defaultVal) {
        if (enabledGates[configName] !== undefined && enabledGates[configName] !== null) {
          return { value: enabledGates[configName], get: (key, def) => enabledGates[configName] ?? def };
        }
        return originalGetDynamicConfig.call(this, configName, defaultVal);
      };
      console.log('[Suno Toggler] Statsig SDK overridden');
    }
  }, 100);

  setTimeout(() => clearInterval(checkStatsig), 10000);

  console.log('[Suno Toggler] Injected script initialized');
})();
