// ==UserScript==
// @name         Suno Feature Toggler + Honeypot Explorer
// @namespace    https://suno.com/
// @version      2.1.0
// @description  UNTESTED https://github.com/Nsomnia/suno-feature-toggler-browser-extension-unreleased-features/new/main Toggle ALL experimental features (agentic/orpheus chat, studio, v2 APIs) + full Honeypot control (geo-challenge, passport, bypass, dump)
// @author       Grok + Nsomnia
// @match        https://suno.com/*
// @match        https://*.suno.com/*
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @run-at       document-start
// @connect      studio-api.prod.suno.com
// @connect      s.prod.suno.com
// ==/UserScript==

(function () {
    'use strict';

    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    // ==================== FEATURE GATES (expanded from your scans + bundles) ====================
    const FEATURE_GATES = {
        'agentic-simple': { name: 'Agentic / Orpheus Chat (B-Side)', default: false, enabled: false },
        'orpheus_is_enabled': { name: 'Orpheus Core Enabled', default: false, enabled: false },
        'orpheus_is_auto_mode': { name: 'Orpheus Auto-Mode', default: false, enabled: false },
        'orpheus_is_canvas_enabled': { name: 'Orpheus Canvas', default: false, enabled: false },
        'orpheus_default_to_chat': { name: 'Default to Chat', default: false, enabled: false },
        'stack-ui': { name: 'Stack UI Mode', default: false, enabled: false },
        'decks-in-stack-mode': { name: 'Decks in Stack Mode', default: false, enabled: false },
        'web-v5-promo': { name: 'V5 Promo Banner', default: false, enabled: false },
        'web-hooks-2025': { name: 'Hooks 2025', default: true, enabled: true },
        'web-theme-selector': { name: 'Theme Selector', default: true, enabled: true },
        'voices-ui': { name: 'Voices UI', default: true, enabled: true },
        'web-omniplayer': { name: 'Omni Player', default: true, enabled: true },
        'simple-remix-ui': { name: 'Simple Remix UI', default: true, enabled: true },
        'multi-sample': { name: 'Multi Sample', default: true, enabled: true },
        'vip-profile-aura': { name: 'VIP Profile Aura', default: false, enabled: false },
        'unhide-b-side': { name: 'Unhide ALL B-Side / Studio Elements', default: false, enabled: false }
    };

    let enabledGates = {};
    let menuIds = {};

    function loadGates() {
        try {
            const saved = GM_getValue('suno_enabledGates_v2');
            if (saved) enabledGates = JSON.parse(saved);
        } catch (e) {}
        Object.keys(FEATURE_GATES).forEach(gate => {
            if (enabledGates[gate] === undefined) enabledGates[gate] = FEATURE_GATES[gate].default;
        });
    }

    function saveGates() {
        GM_setValue('suno_enabledGates_v2', JSON.stringify(enabledGates));
    }

    function updateGateMenu() {
        Object.keys(FEATURE_GATES).forEach(gate => {
            const cfg = FEATURE_GATES[gate];
            const label = `${cfg.name}: ${enabledGates[gate] ? '✅ ON' : '❌ OFF'}`;
            if (menuIds[gate]) GM_unregisterMenuCommand(menuIds[gate]);
            menuIds[gate] = GM_registerMenuCommand(label, () => {
                enabledGates[gate] = !enabledGates[gate];
                saveGates();
                updateGateMenu();
                if (gate === 'unhide-b-side') applyUnhideCSS();
                console.log(`[Suno Toggler] ${gate} → ${enabledGates[gate]}`);
            });
        });
    }

    // ==================== HONEYPOT CONTROLS (from the 3 honeypot JS files you provided) ====================
    function registerHoneypotMenu() {
        GM_registerMenuCommand('🔍 Dump Honeypot Object', () => {
            if (!win.honeypot) return console.warn('[Suno] Honeypot not loaded yet');
            console.table({
                honey: win.honeypot.honey,
                geofenceResults: win.honeypot.geofenceResults,
                pageLoadId: win.honeypot.pageLoadId,
                deviceId: win.honeypot.deviceId,
                sessionId: win.honeypot.sessionId
            });
            console.log('Full honey sealed payload:', win.honeypot.honey?.sealed);
        });

        GM_registerMenuCommand('🚀 Force GeoCaptcha Challenge', async () => {
            if (!win.honeypot) return alert('Honeypot not ready');
            await win.honeypot.showChallenge({
                allow: true,
                title: 'Suno Toggler Challenge',
                description: 'Test mode – share location to continue',
                animation: 'simple',
                colors: { button: '#2081E2' }
            });
            console.log('[Suno] GeoCaptcha forced');
        });

        GM_registerMenuCommand('🔑 Trigger Passport Prompt', async () => {
            if (!win.honeypot) return;
            await win.honeypot.processPassport();
            console.log('[Suno] Passport prompt triggered');
        });

        GM_registerMenuCommand('🛡️ Bypass Geofence Redirect', () => {
            if (!win.honeypot?.geofenceResults) return;
            win.honeypot.geofenceResults.redirectUrl = null;
            win.honeypot.geofenceResults.autoRedirect = false;
            win.honeypot.processGeofenceResults();
            console.log('[Suno] Geofence bypassed');
        });

        GM_registerMenuCommand('📡 Track Test Event (honeypot)', () => {
            if (!win.honeypot) return;
            win.honeypot.track('__test_from_userscript', { toggler: true, version: '2.1.0' })
                .then(r => console.log('Track response:', r))
                .catch(console.error);
        });
    }

    // ==================== UNHIDE B-SIDE / STUDIO (from endpoint extractor + studio-api-prod) ====================
    function applyUnhideCSS() {
        const style = document.createElement('style');
        style.id = 'suno-unhide-bside';
        style.textContent = `
            [class*="b-side"], [class*="studio-"], [data-testid*="studio"], 
            .b-side, .studio-waitlist, .studio-welcome, 
            [href*="/b-side/"], [href*="/studio-"] {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: auto !important;
            }
            /* Force studio projects / v2 routes */
            a[href*="/me/v2/studio-projects"], a[href*="/v2/"] { display: flex !important; }
        `;
        if (enabledGates['unhide-b-side']) {
            if (!document.getElementById('suno-unhide-bside')) document.head.appendChild(style);
        } else {
            const existing = document.getElementById('suno-unhide-bside');
            if (existing) existing.remove();
        }
    }

    // ==================== FETCH INTERCEPTOR (enhanced with studio-api-prod + honeypot ping) ====================
    const originalFetch = win.fetch;
    win.fetch = async function (...args) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');

        const response = await originalFetch.apply(this, args);
        const clone = response.clone();

        // Statsig gates (your original + orpheus)
        if (url.includes('s.prod.suno.com/v1/initialize') || url.includes('s.prod.suno.com/v1/rgstr')) {
            try {
                const data = await clone.json();
                if (data.dynamic_configs) {
                    Object.keys(enabledGates).forEach(g => {
                        data.dynamic_configs[g] = { value: enabledGates[g], gateValue: String(enabledGates[g]) };
                    });
                }
                return new Response(JSON.stringify(data), { status: response.status, headers: response.headers });
            } catch (e) {}
        }

        // Statsig experiment
        if (url.includes('/api/statsig/experiment/')) {
            try {
                const data = await clone.json();
                if (data.data) {
                    Object.keys(enabledGates).forEach(g => { if (enabledGates[g]) data.data[g] = true; });
                    // Orpheus extras
                    if (enabledGates['agentic-simple']) {
                        data.data.orpheus_is_enabled = true;
                        data.data.orpheus_is_auto_mode = true;
                        data.data.orpheus_is_canvas_enabled = true;
                        data.data.orpheus_default_to_chat = true;
                    }
                }
                return new Response(JSON.stringify(data), { status: 200, headers: response.headers });
            } catch (e) {}
        }

        // Billing VIP spoof (enhanced)
        if (url.includes('/api/billing/info/')) {
            try {
                const data = await clone.json();
                data.is_active = true;
                data.is_vip = true;
                data.credits = 9999999;
                data.total_credits_left = 9999999;
                if (data.plan) {
                    data.plan.plan_key = "premier";
                    data.plan.name = "Premier Unlimited";
                    data.plan.level = 30;
                }
                return new Response(JSON.stringify(data), { status: 200, headers: response.headers });
            } catch (e) {}
        }

        // Events + honeypot ping
        if (url.includes('/v1/events') || url.includes('58sj3ae84cd6') || url.includes('m-stratovibe')) {
            try {
                const data = await clone.json();
                // ... (your original event rewrite)
                return new Response(JSON.stringify(data), { status: response.status, headers: response.headers });
            } catch (e) {}
        }

        // Log studio-api-prod calls (for debugging v2 endpoints)
        if (url.includes('studio-api-prod.suno.com')) {
            console.log(`[Suno Studio API] ${url}`, args[1]);
        }

        return response;
    };

    // ==================== STATSG + HONEYPOT SDK HOOKS ====================
    const checkSDKs = setInterval(() => {
        // Statsig (your original)
        if (win.statsig) {
            const orig = win.statsig.checkGate;
            win.statsig.checkGate = function (gate) {
                if (enabledGates[gate] !== undefined) {
                    console.log(`[Suno Toggler] checkGate("${gate}") → ${enabledGates[gate]}`);
                    return enabledGates[gate];
                }
                return orig.apply(this, arguments);
            };
        }

        // Honeypot ready
        if (win.honeypot) {
            console.log('[Suno Toggler] Honeypot detected – controls enabled');
            clearInterval(checkSDKs);
        }
    }, 150);

    // ==================== UI UNHIDE + INITIALISATION ====================
    function initUI() {
        applyUnhideCSS();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                updateGateMenu();
                registerHoneypotMenu();
            });
        } else {
            updateGateMenu();
            registerHoneypotMenu();
        }
    }

    loadGates();
    initUI();

    console.log('%c[Suno Toggler 2.1] Loaded – Tampermonkey menu has gates + Honeypot tools', 'color:#00ff00;font-weight:bold');
})();
