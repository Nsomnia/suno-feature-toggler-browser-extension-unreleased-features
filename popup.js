const FEATURE_GATES = {
  'agentic-simple': { name: 'Agentic Song Creator', category: 'experimental', default: false, description: 'Conversational LLM-based song creator' },
  'stack-ui': { name: 'Stack UI Mode', category: 'experimental', default: false, description: 'Alternative stack interface' },
  'decks-in-stack-mode': { name: 'Decks in Stack Mode', category: 'experimental', default: false, description: 'Deck-based UI in stack view' },
  'web-v5-promo': { name: 'V5 Promo Banner', category: 'experimental', default: false, description: 'Show v5 model promotion' },
  'sample': { name: 'Sample Feature', category: 'features', default: true, description: 'Use any audio as seed' },
  'mashup-ui': { name: 'Mashup UI', category: 'features', default: true, description: 'Mashup functionality interface' },
  'create-sounds': { name: 'Create Sounds', category: 'features', default: true, description: 'Sound generation feature' },
  'gen-video-covers': { name: 'Video Covers', category: 'features', default: true, description: 'Generate video covers' },
  'web-hooks-2025': { name: 'Hooks Feature', category: 'features', default: true, description: 'Sample clips/hooks system' },
  'web-theme-selector': { name: 'Theme Selector', category: 'features', default: true, description: 'Theme selection UI' },
  'sprig-surveys': { name: 'User Surveys', category: 'features', default: true, description: 'Survey system' },
  'forced-age-verification': { name: 'Age Verification', category: 'features', default: true, description: 'Force age verification' },
  'lazy-load-hcaptcha': { name: 'Lazy Captcha', category: 'features', default: true, description: 'Optimize captcha loading' },
  'artist-profiles-hooks': { name: 'Artist Profile Hooks', category: 'features', default: true, description: 'Artist profile features' },
  'enable-frontend-profile-pic-upload': { name: 'Profile Pic Upload', category: 'features', default: true, description: 'Upload profile pictures' },
  'voices-ui': { name: 'Voices UI', category: 'features', default: true, description: 'Voice selection interface' },
  'web-omniplayer': { name: 'Omni Player', category: 'features', default: true, description: 'Universal player component' },
  'simple-remix-ui': { name: 'Simple Remix UI', category: 'features', default: true, description: 'Simplified remix interface' },
  'multi-sample': { name: 'Multi Sample', category: 'features', default: true, description: 'Multiple sample support' },
  'logged-in-song-page-v2': { name: 'Song Page V2', category: 'features', default: true, description: 'Updated song page for logged users' },
  'audio-upload-tag-editing': { name: 'Audio Tag Editing', category: 'features', default: true, description: 'Edit tags on uploaded audio' },
  'enable-sharelist-and-share-notifications': { name: 'Share Notifications', category: 'features', default: true, description: 'Enable sharing features' },
  'vip-profile-aura': { name: 'VIP Profile Aura', category: 'features', default: false, description: 'VIP badge on profile' },
  'web-clip-preview-toggle': { name: 'Clip Preview Toggle', category: 'ui', default: true, description: 'Toggle clip preview' },
  'collapsible-library-rows': { name: 'Collapsible Library', category: 'ui', default: true, description: 'Collapsible library rows' },
  'defer-account-deletions': { name: 'Defer Deletions', category: 'internal', default: true, description: 'Delay account deletion' },
  'can-delete-account': { name: 'Can Delete Account', category: 'internal', default: true, description: 'Account deletion permission' },
  'anti-abuse-checks-enabled': { name: 'Anti Abuse Checks', category: 'internal', default: true, description: 'Abuse prevention system' },
  'use_tanstack_single_clip': { name: 'TanStack Single Clip', category: 'internal', default: true, description: 'TanStack query for clips' },
  'use_tanstack_mutations': { name: 'TanStack Mutations', category: 'internal', default: true, description: 'TanStack mutations' }
};

let enabledGates = {};

function save() {
  chrome.storage.local.set({ enabledGates });
}

function load(callback) {
  chrome.storage.local.get(['enabledGates'], (result) => {
    enabledGates = result.enabledGates || {};
    callback();
  });
}

function renderGates() {
  const experimental = document.getElementById('experimental-gates');
  const active = document.getElementById('active-gates');
  const internal = document.getElementById('internal-gates');

  experimental.innerHTML = '';
  active.innerHTML = '';
  internal.innerHTML = '';

  Object.entries(FEATURE_GATES).forEach(([key, config]) => {
    const container = config.category === 'experimental' ? experimental :
                      config.category === 'internal' || config.category === 'ui' ? internal : active;

    const isOverridden = enabledGates[key] !== undefined && enabledGates[key] !== null;
    const value = isOverridden ? enabledGates[key] : config.default;

    const gateEl = document.createElement('div');
    gateEl.className = 'gate';
    gateEl.innerHTML = `
      <div class="gate-info">
        <div class="gate-name">${config.name}</div>
        <div class="gate-desc">${config.description}</div>
      </div>
      <div class="gate-right">
        <span class="status ${isOverridden ? 'override' : (config.default ? 'active' : '')}">${isOverridden ? 'OVERRIDE' : (config.default ? 'ON' : 'OFF')}</span>
        <div class="toggle ${value ? 'on' : ''}" data-gate="${key}">
          <div class="knob"></div>
        </div>
      </div>
    `;
    container.appendChild(gateEl);
  });

  document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const gate = toggle.dataset.gate;
      const current = enabledGates[gate];

      if (current === undefined || current === null) {
        enabledGates[gate] = !FEATURE_GATES[gate].default;
      } else if (current === true) {
        enabledGates[gate] = false;
      } else {
        enabledGates[gate] = null;
      }

      save();
      renderGates();
    });
  });

  updateOverrideCount();
}

function updateOverrideCount() {
  const count = Object.values(enabledGates).filter(v => v !== null).length;
  document.getElementById('override-count').textContent = count;
}

document.getElementById('reset-btn').addEventListener('click', () => {
  enabledGates = {};
  save();
  renderGates();
});

document.getElementById('reload-btn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  load(renderGates);
});
