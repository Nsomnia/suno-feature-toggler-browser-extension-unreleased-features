// ==UserScript==
// @name         Suno Feature Toggler + Promo Explorer v2.3
// @namespace    https://suno.com/
// @version      2.3.0
// @description  Toggle features + safe promo redeem (fixed endpoint)
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
// @connect      studio-api-prod.suno.com
// ==/UserScript==

(function () {
    'use strict';

    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    const FEATURE_GATES = {
        'agentic-simple': { name: 'Agentic / Orpheus Chat', default: false },
        'orpheus_is_enabled': { name: 'Orpheus Core', default: false },
        'orpheus_is_auto_mode': { name: 'Orpheus Auto', default: false },
        'studio': { name: 'Suno Studio', default: false },
        'custom_models': { name: 'Custom Models', default: false },
        'negative_tags': { name: 'Negative Tags', default: false },
        'long_uploads': { name: 'Long Uploads', default: false },
        'unhide-b-side': { name: 'Unhide B-Side/Studio', default: false }
    };

    let enabledGates = {};
    let menuIds = {};

    function loadGates() {
        try {
            const saved = GM_getValue('suno_enabledGates_v2');
            if (saved) enabledGates = JSON.parse(saved);
        } catch (e) {}
        Object.keys(FEATURE_GATES).forEach(g => {
            if (enabledGates[g] === undefined) enabledGates[g] = FEATURE_GATES[g].default;
        });
    }

    function saveGates() {
        GM_setValue('suno_enabledGates_v2', JSON.stringify(enabledGates));
    }

    function updateGateMenu() {
        Object.keys(FEATURE_GATES).forEach(g => {
            const cfg = FEATURE_GATES[g];
            const label = `${cfg.name}: ${enabledGates[g] ? 'ON' : 'OFF'}`;
            if (menuIds[g]) GM_unregisterMenuCommand(menuIds[g]);
            menuIds[g] = GM_registerMenuCommand(label, () => {
                enabledGates[g] = !enabledGates[g];
                saveGates();
                updateGateMenu();
                if (g === 'unhide-b-side') applyUnhideCSS();
                console.log(`[Suno] ${g} → ${enabledGates[g]}`);
            });
        });
    }

    // Promo codes
    const UNLTD_PROMO_CODES = [ /* your long list here - keep as-is */ ];

    // Fetch interceptor
    const originalFetch = win.fetch;
    win.fetch = async function (...args) {
        let url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');

        const response = await originalFetch.apply(this, args);
        const clone = response.clone();

        try {
            let text = await clone.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                return response;
            }

            // Billing spoof
            if (url.includes('/api/billing/info/')) {
                data.is_vip = true;
                data.credits = 9999999;
                data.total_credits_left = 9999999;
                if (data.plan) data.plan.plan_key = "premier";
                console.log('[Suno] VIP + unlimited credits');
                return new Response(JSON.stringify(data), { status: 200, headers: response.headers });
            }

            // Statsig
            if (url.includes('/api/statsig/experiment/') || url.includes('/v1/rgstr')) {
                if (data.data) {
                    Object.keys(enabledGates).forEach(g => {
                        if (enabledGates[g]) data.data[g] = true;
                    });
                }
            }

            return new Response(JSON.stringify(data), { status: response.status, headers: response.headers });
        } catch (e) {}

        return response;
    };

    // Safe redeem (fixed endpoint)
    GM_registerMenuCommand('🎟️ Redeem Promo Code', async () => {
        const code = prompt('Enter promo code:');
        if (!code) return;

        try {
            const res = await fetch('https://studio-api-prod.suno.com/api/billing/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            const text = await res.text();
            console.log('[Promo Redeem]', text);

            let json;
            try {
                json = JSON.parse(text);
                alert(json.message || JSON.stringify(json));
            } catch {
                alert('Raw: ' + text.substring(0, 300));
            }
        } catch (err) {
            console.error(err);
            alert('Failed: ' + err.message);
        }
    });

    function applyUnhideCSS() {
        let style = document.getElementById('suno-unhide');
        if (!style) {
            style = document.createElement('style');
            style.id = 'suno-unhide';
            document.head.appendChild(style);
        }
        style.textContent = enabledGates['unhide-b-side'] ? `
            [class*="studio"], [class*="b-side"], [data-testid*="studio"] { display: block !important; }
        ` : '';
    }

    function init() {
        loadGates();
        updateGateMenu();
        applyUnhideCSS();
        console.log('%c[Suno Toggler 2.3] Ready', 'color:#0f0');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
