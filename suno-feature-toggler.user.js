// ==UserScript==
// @name         Suno Feature Toggler
// @namespace    https://suno.com/
// @version      1.0.0
// @description  Toggle experimental Suno features including agentic-simple (orchestrator), feature gates, and model modes
// @author       User
// @match        https://suno.com/*
// @match        https://*.suno.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// @connect      studio-api.prod.suno.com
// @connect      s.prod.suno.com
// @connect      auth.suno.com
// ==/UserScript==

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    
    const CONFIG = {
        STORAGE_PREFIX: 'suno_toggler_',
        STATSIG_URL: 's.prod.suno.com',
        STUDIO_API_URL: 'studio-api.prod.suno.com'
    };

    // All discovered feature gates
    const FEATURE_GATES = {
        // HIGH VALUE - Experimental/Beta Features
        'agentic-simple': { name: 'Agentic Song Creator (Orchestrator)', category: 'experimental', default: false, description: 'Conversational LLM-based song creator' },
        'stack-ui': { name: 'Stack UI Mode', category: 'experimental', default: false, description: 'Alternative stack interface' },
        'decks-in-stack-mode': { name: 'Decks in Stack Mode', category: 'experimental', default: false, description: 'Deck-based UI in stack view' },
        'web-v5-promo': { name: 'V5 Promo Banner', category: 'experimental', default: false, description: 'Show v5 model promotion' },
        
        // ENABLED BY DEFAULT - Active Features
        'sample': { name: 'Sample Feature', category: 'features', default: true, description: 'Use any audio as seed' },
        'mashup-ui': { name: 'Mashup UI', category: 'features', default: true, description: 'Mashup functionality interface' },
        'create-sounds': { name: 'Create Sounds', category: 'features', default: true, description: 'Sound generation feature' },
        'gen-video-covers': { name: 'Video Covers', category: 'features', default: true, description: 'Generate video covers' },
        'web-hooks-2025': { name: 'Hooks Feature', category: 'features', default: true, description: 'Sample clips/hooks system' },
        'web-theme-selector': { name: 'Theme Selector', category: 'features', default: true, description: 'Theme selection UI' },
        'sprig-surveys': { name: 'User Surveys', category: 'features', default: true, description: 'Survey system (50% rollout)' },
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
        'defer-account-deletions': { name: 'Defer Deletions', category: 'internal', default: true, description: 'Delay account deletion' },
        'collapsible-library-rows': { name: 'Collapsible Library', category: 'ui', default: true, description: 'Collapsible library rows' },
        'can-delete-account': { name: 'Can Delete Account', category: 'internal', default: true, description: 'Account deletion permission' },
        'anti-abuse-checks-enabled': { name: 'Anti Abuse Checks', category: 'internal', default: true, description: 'Abuse prevention system' },
        'use_tanstack_single_clip': { name: 'TanStack Single Clip', category: 'internal', default: true, description: 'TanStack query for clips' },
        'use_tanstack_mutations': { name: 'TanStack Mutations', category: 'internal', default: true, description: 'TanStack mutations' },
        'web-clip-preview-toggle': { name: 'Clip Preview Toggle', category: 'ui', default: true, description: 'Toggle clip preview' },
        'web-hooks-2025': { name: 'Web Hooks 2025', category: 'features', default: true, description: '2025 hooks implementation' }
    };

    // Model configurations
    const MODELS = {
        'chirp-crow': { name: 'Chirp Crow (V5 Default)', version: 'v5' },
        'chirp-chirp': { name: 'Chirp Chirp (V5 Alt)', version: 'v5' }
    };

    // State management
    let state = {
        enabledGates: {},
        jwtToken: null,
        deviceId: null,
        userId: null,
        sessionId: null,
        visible: false
    };

    // ============================================
    // STORAGE UTILITIES
    // ============================================
    
    function save(key, value) {
        localStorage.setItem(CONFIG.STORAGE_PREFIX + key, JSON.stringify(value));
    }
    
    function load(key, defaultValue = null) {
        const stored = localStorage.getItem(CONFIG.STORAGE_PREFIX + key);
        return stored ? JSON.parse(stored) : defaultValue;
    }
    
    function remove(key) {
        localStorage.removeItem(CONFIG.STORAGE_PREFIX + key);
    }

    // ============================================
    // JWT TOKEN MANAGEMENT
    // ============================================
    
    function parseJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('[Suno Toggler] Failed to parse JWT:', e);
            return null;
        }
    }

    function extractTokenFromPage() {
        // Try to get from localStorage
        const clerkKeys = Object.keys(localStorage).filter(k => k.includes('clerk'));
        for (const key of clerkKeys) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data?.token) {
                    return data.token;
                }
            } catch (e) {}
        }
        
        // Try to get from sessionStorage
        const sessionKeys = Object.keys(sessionStorage).filter(k => k.includes('clerk'));
        for (const key of sessionKeys) {
            try {
                const data = JSON.parse(sessionStorage.getItem(key));
                if (data?.token) {
                    return data.token;
                }
            } catch (e) {}
        }
        
        return null;
    }

    function setJWTToken(token) {
        state.jwtToken = token;
        save('jwtToken', token);
        
        if (token) {
            const parsed = parseJWT(token);
            if (parsed) {
                state.userId = parsed['suno.com/claims/user_id'] || parsed.sub;
                state.sessionId = parsed.sid;
                console.log('[Suno Toggler] Token parsed:', {
                    userId: state.userId,
                    sessionId: state.sessionId,
                    exp: new Date(parsed.exp * 1000).toISOString()
                });
            }
        }
    }

    // ============================================
    // INTERCEPTOR FUNCTIONS
    // ============================================
    
    function interceptFetch() {
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const [url, options] = args;
            const urlString = typeof url === 'string' ? url : url.toString();
            
            // Capture auth token from requests
            if (options?.headers) {
                const auth = options.headers['Authorization'] || options.headers['authorization'];
                if (auth && auth.startsWith('Bearer ')) {
                    const token = auth.substring(7);
                    if (token !== state.jwtToken) {
                        setJWTToken(token);
                    }
                }
                const device = options.headers['Device-Id'] || options.headers['device-id'];
                if (device) {
                    state.deviceId = device;
                    save('deviceId', device);
                }
            }
            
            // Intercept Statsig initialize - modify feature gates
            if (urlString.includes('s.prod.suno.com/v1/initialize') || urlString.includes('s.prod.suno.com/v1/rgstr')) {
                const response = await originalFetch.apply(this, args);
                try {
                    const text = await response.text();
                    let data = JSON.parse(text);
                    
                    // Modify dynamic configs based on our toggles
                    if (data.dynamic_configs) {
                        Object.keys(state.enabledGates).forEach(gate => {
                            if (state.enabledGates[gate] !== null) {
                                data.dynamic_configs[gate] = {
                                    value: state.enabledGates[gate],
                                    gateValue: state.enabledGates[gate] ? 'true' : 'false'
                                };
                            }
                        });
                    }
                    
                    console.log('[Suno Toggler] Modified Statsig response');
                    return new Response(JSON.stringify(data), {
                        status: response.status,
                        headers: response.headers
                    });
                } catch (e) {
                    console.error('[Suno Toggler] Failed to modify Statsig:', e);
                }
            }
            
            // Intercept gate_exposure events to override
            if (urlString.includes('s.prod.suno.com/v1/events') || urlString.includes('m-stratovibe')) {
                const response = await originalFetch.apply(this, args);
                try {
                    const text = await response.text();
                    let data = JSON.parse(text);
                    
                    // Modify events if they contain gate exposures
                    if (data.events) {
                        data.events = data.events.map(event => {
                            if (event.eventName === 'statsig::gate_exposure' && event.metadata?.gate) {
                                const gateName = event.metadata.gate;
                                if (state.enabledGates[gateName] !== undefined && state.enabledGates[gateName] !== null) {
                                    event.metadata.gateValue = state.enabledGates[gateName] ? 'true' : 'false';
                                    event.metadata.ruleID = 'user_override';
                                }
                            }
                            return event;
                        });
                    }
                    
                    return new Response(JSON.stringify(data), {
                        status: response.status,
                        headers: response.headers
                    });
                } catch (e) {
                    return response;
                }
            }
            
            return originalFetch.apply(this, args);
        };
    }

    function interceptXHR() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
        
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            this._url = url;
            this._method = method;
            return originalOpen.apply(this, [method, url, ...rest]);
        };
        
        XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
            if (header.toLowerCase() === 'authorization' && value.startsWith('Bearer ')) {
                const token = value.substring(7);
                if (token !== state.jwtToken) {
                    setJWTToken(token);
                }
            }
            return originalSetRequestHeader.apply(this, arguments);
        };
    }

    // ============================================
    // STATSIG SDK OVERRIDE
    // ============================================
    
    function overrideStatsig() {
        const checkInterval = setInterval(() => {
            if (window.statsig) {
                clearInterval(checkInterval);
                
                const originalCheckGate = window.statsig.checkGate;
                window.statsig.checkGate = function(gateName, options) {
                    if (state.enabledGates[gateName] !== undefined && state.enabledGates[gateName] !== null) {
                        console.log(`[Suno Toggler] Gate "${gateName}" overridden to: ${state.enabledGates[gateName]}`);
                        return state.enabledGates[gateName];
                    }
                    return originalCheckGate.call(this, gateName, options);
                };
                
                const originalGetDynamicConfig = window.statsig.getDynamicConfig;
                window.statsig.getDynamicConfig = function(configName, defaultVal) {
                    if (state.enabledGates[configName] !== undefined && state.enabledGates[configName] !== null) {
                        return {
                            value: state.enabledGates[configName],
                            get: (key, def) => state.enabledGates[configName] ?? def
                        };
                    }
                    return originalGetDynamicConfig.call(this, configName, defaultVal);
                };
                
                console.log('[Suno Toggler] Statsig SDK overridden');
            }
        }, 100);
        
        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
    }

    // ============================================
    // UI PANEL
    // ============================================
    
    function createUI() {
        // Remove existing panel if any
        const existing = document.getElementById('suno-toggler-panel');
        if (existing) existing.remove();
        
        const panel = document.createElement('div');
        panel.id = 'suno-toggler-panel';
        panel.innerHTML = `
            <style>
                #suno-toggler-panel {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    width: 380px;
                    max-height: 80vh;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 1px solid #0f3460;
                    border-radius: 12px;
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: #e8e8e8;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                    display: none;
                    overflow: hidden;
                }
                #suno-toggler-panel.visible { display: block; }
                #suno-toggler-panel * { box-sizing: border-box; }
                
                .st-header {
                    background: linear-gradient(90deg, #e94560 0%, #ff6b6b 100%);
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: move;
                }
                .st-header h2 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                }
                .st-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 4px 8px;
                }
                
                .st-content {
                    padding: 16px;
                    max-height: calc(80vh - 60px);
                    overflow-y: auto;
                }
                
                .st-section {
                    margin-bottom: 20px;
                }
                .st-section-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: #e94560;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 10px;
                    padding-bottom: 6px;
                    border-bottom: 1px solid #333;
                }
                
                .st-gate {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #2a2a4a;
                }
                .st-gate:last-child { border-bottom: none; }
                .st-gate-info { flex: 1; }
                .st-gate-name {
                    font-size: 13px;
                    font-weight: 500;
                    color: #fff;
                }
                .st-gate-desc {
                    font-size: 11px;
                    color: #888;
                    margin-top: 2px;
                }
                
                .st-toggle {
                    position: relative;
                    width: 44px;
                    height: 24px;
                    background: #333;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: background 0.2s;
                    flex-shrink: 0;
                    margin-left: 12px;
                }
                .st-toggle.on { background: #e94560; }
                .st-toggle.knob {
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 20px;
                    height: 20px;
                    background: white;
                    border-radius: 50%;
                    transition: transform 0.2s;
                }
                .st-toggle.on .st-toggle.knob { transform: translateX(20px); }
                
                .st-status {
                    font-size: 11px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: #333;
                    color: #888;
                    margin-left: 8px;
                }
                .st-status.active { background: #2e7d32; color: #fff; }
                .st-status.override { background: #e94560; color: #fff; }
                
                .st-token-section {
                    background: #1a1a2e;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 16px;
                }
                .st-token-input {
                    width: 100%;
                    background: #0f0f1a;
                    border: 1px solid #333;
                    border-radius: 6px;
                    padding: 10px;
                    color: #fff;
                    font-size: 12px;
                    font-family: monospace;
                    resize: vertical;
                    min-height: 60px;
                }
                .st-token-input:focus {
                    outline: none;
                    border-color: #e94560;
                }
                .st-token-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 8px;
                }
                .st-btn {
                    flex: 1;
                    padding: 8px 12px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .st-btn-primary {
                    background: #e94560;
                    color: white;
                }
                .st-btn-primary:hover { background: #ff6b6b; }
                .st-btn-secondary {
                    background: #333;
                    color: #888;
                }
                .st-btn-secondary:hover { background: #444; }
                
                .st-info {
                    font-size: 11px;
                    color: #888;
                    margin-top: 8px;
                }
                .st-info code {
                    background: #0f0f1a;
                    padding: 2px 4px;
                    border-radius: 3px;
                    color: #e94560;
                }
                
                .st-fab {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    z-index: 999998;
                    box-shadow: 0 4px 16px rgba(233,69,96,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    color: white;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .st-fab:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 24px rgba(233,69,96,0.6);
                }
                
                .st-footer {
                    padding: 12px 16px;
                    background: #0f0f1a;
                    border-top: 1px solid #333;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .st-footer-btns {
                    display: flex;
                    gap: 8px;
                }
                .st-footer-btn {
                    padding: 6px 12px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    background: #333;
                    color: #888;
                }
                .st-footer-btn:hover { background: #444; }
                .st-footer-btn.danger { background: #b71c1c; color: #fff; }
                .st-footer-btn.danger:hover { background: #c62828; }
            </style>
            
            <div class="st-header">
                <h2>Suno Feature Toggler</h2>
                <button class="st-close" onclick="document.getElementById('suno-toggler-panel').classList.remove('visible')">&times;</button>
            </div>
            
            <div class="st-content">
                <div class="st-section">
                    <div class="st-section-title">JWT Token</div>
                    <div class="st-token-section">
                        <textarea class="st-token-input" id="st-jwt-input" placeholder="Paste your JWT token here or it will be auto-captured from requests..."></textarea>
                        <div class="st-token-actions">
                            <button class="st-btn st-btn-primary" onclick="window.sunoTogglerSaveToken()">Save Token</button>
                            <button class="st-btn st-btn-secondary" onclick="window.sunoTogglerClearToken()">Clear</button>
                        </div>
                        <div class="st-info" id="st-token-info">
                            Token will be captured automatically from API requests.
                        </div>
                    </div>
                </div>
                
                <div class="st-section">
                    <div class="st-section-title">Experimental Features (Beta)</div>
                    <div id="st-experimental-gates"></div>
                </div>
                
                <div class="st-section">
                    <div class="st-section-title">Active Features</div>
                    <div id="st-active-gates"></div>
                </div>
                
                <div class="st-section">
                    <div class="st-section-title">UI/Internal Settings</div>
                    <div id="st-internal-gates"></div>
                </div>
            </div>
            
            <div class="st-footer">
                <div class="st-info">Override: <span id="st-override-count">0</span> gates</div>
                <div class="st-footer-btns">
                    <button class="st-footer-btn" onclick="window.sunoTogglerExport()">Export</button>
                    <button class="st-footer-btn" onclick="window.sunoTogglerImport()">Import</button>
                    <button class="st-footer-btn danger" onclick="window.sunoTogglerReset()">Reset All</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Populate gates
        populateGates();
        
        // Make panel draggable
        makeDraggable(panel);
        
        // Update token info
        updateTokenInfo();
    }
    
    function populateGates() {
        const experimental = document.getElementById('st-experimental-gates');
        const active = document.getElementById('st-active-gates');
        const internal = document.getElementById('st-internal-gates');
        
        Object.entries(FEATURE_GATES).forEach(([key, config]) => {
            const container = config.category === 'experimental' ? experimental :
                             config.category === 'internal' || config.category === 'ui' ? internal : active;
            
            const isOverridden = state.enabledGates[key] !== undefined && state.enabledGates[key] !== null;
            const value = isOverridden ? state.enabledGates[key] : config.default;
            
            const gateEl = document.createElement('div');
            gateEl.className = 'st-gate';
            gateEl.innerHTML = `
                <div class="st-gate-info">
                    <div class="st-gate-name">${config.name}</div>
                    <div class="st-gate-desc">${config.description}</div>
                </div>
                <span class="st-status ${isOverridden ? 'override' : (config.default ? 'active' : '')}">${isOverridden ? 'OVERRIDE' : (config.default ? 'ON' : 'OFF')}</span>
                <div class="st-toggle ${value ? 'on' : ''}" data-gate="${key}">
                    <div class="st-toggle knob"></div>
                </div>
            `;
            
            container.appendChild(gateEl);
        });
        
        // Add click handlers
        document.querySelectorAll('.st-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const gate = toggle.dataset.gate;
                const current = state.enabledGates[gate];
                
                // Toggle between true, false, and null (reset to default)
                if (current === undefined || current === null) {
                    state.enabledGates[gate] = !FEATURE_GATES[gate].default;
                } else if (current === true) {
                    state.enabledGates[gate] = false;
                } else {
                    state.enabledGates[gate] = null; // Reset to default
                }
                
                save('enabledGates', state.enabledGates);
                updateUI();
                showNotification(`Gate "${gate}" updated. Reload page to apply.`);
            });
        });
        
        updateOverrideCount();
    }
    
    function updateOverrideCount() {
        const count = Object.values(state.enabledGates).filter(v => v !== null).length;
        const el = document.getElementById('st-override-count');
        if (el) el.textContent = count;
    }
    
    function updateTokenInfo() {
        const info = document.getElementById('st-token-info');
        const input = document.getElementById('st-jwt-input');
        
        if (state.jwtToken) {
            const parsed = parseJWT(state.jwtToken);
            if (parsed) {
                info.innerHTML = `User: <code>${state.userId || 'N/A'}</code><br>Session: <code>${state.sessionId?.substring(0, 12) || 'N/A'}...</code><br>Expires: <code>${new Date(parsed.exp * 1000).toLocaleString()}</code>`;
            }
            input.value = state.jwtToken;
        } else {
            info.textContent = 'Token will be captured automatically from API requests.';
        }
    }
    
    function makeDraggable(el) {
        const header = el.querySelector('.st-header');
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = el.offsetLeft;
            initialY = el.offsetTop;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            el.style.left = initialX + dx + 'px';
            el.style.top = initialY + dy + 'px';
            el.style.right = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
    
    function createFAB() {
        const fab = document.createElement('button');
        fab.className = 'st-fab';
        fab.innerHTML = '🎛️';
        fab.onclick = () => {
            const panel = document.getElementById('suno-toggler-panel');
            panel.classList.toggle('visible');
        };
        document.body.appendChild(fab);
    }
    
    function updateUI() {
        const panel = document.getElementById('suno-toggler-panel');
        if (panel) {
            panel.remove();
        }
        createUI();
        if (state.visible) {
            document.getElementById('suno-toggler-panel').classList.add('visible');
        }
    }
    
    function showNotification(message, type = 'info') {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#b71c1c' : '#1a1a2e'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000000;
            font-family: sans-serif;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        `;
        notif.textContent = message;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }

    // ============================================
    // GLOBAL FUNCTIONS FOR UI
    // ============================================
    
    window.sunoTogglerSaveToken = function() {
        const input = document.getElementById('st-jwt-input');
        const token = input.value.trim();
        if (token) {
            setJWTToken(token);
            updateTokenInfo();
            showNotification('Token saved successfully!');
        }
    };
    
    window.sunoTogglerClearToken = function() {
        state.jwtToken = null;
        state.userId = null;
        state.sessionId = null;
        remove('jwtToken');
        updateTokenInfo();
        showNotification('Token cleared');
    };
    
    window.sunoTogglerExport = function() {
        const data = {
            enabledGates: state.enabledGates,
            jwtToken: state.jwtToken,
            deviceId: state.deviceId
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'suno-toggler-config.json';
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Configuration exported');
    };
    
    window.sunoTogglerImport = function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.enabledGates) state.enabledGates = data.enabledGates;
                    if (data.jwtToken) setJWTToken(data.jwtToken);
                    if (data.deviceId) state.deviceId = data.deviceId;
                    save('enabledGates', state.enabledGates);
                    updateUI();
                    showNotification('Configuration imported!');
                } catch (err) {
                    showNotification('Invalid configuration file', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };
    
    window.sunoTogglerReset = function() {
        if (confirm('Reset all overrides to defaults?')) {
            state.enabledGates = {};
            save('enabledGates', {});
            updateUI();
            showNotification('All gates reset to defaults. Reload page to apply.');
        }
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    
    function init() {
        console.log('[Suno Toggler] Initializing...');
        
        // Load saved state
        state.enabledGates = load('enabledGates', {});
        state.jwtToken = load('jwtToken', null);
        state.deviceId = load('deviceId', null);
        
        // Set up interceptors before page loads
        interceptFetch();
        interceptXHR();
        
        // Override Statsig after it loads
        overrideStatsig();
        
        // Extract token from page storage
        setTimeout(() => {
            const token = extractTokenFromPage();
            if (token && token !== state.jwtToken) {
                setJWTToken(token);
            }
        }, 1000);
        
        // Create UI when DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                createUI();
                createFAB();
            });
        } else {
            createUI();
            createFAB();
        }
        
        console.log('[Suno Toggler] Ready! Click the 🎛️ button to toggle features.');
    }
    
    // Start
    init();
    
})();
