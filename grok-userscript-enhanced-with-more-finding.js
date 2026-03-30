// ==UserScript==
// @name         Suno Feature Toggler + Honeypot Explorer + Promo Injector v2.2
// @namespace    https://suno.com/
// @version      2.2.0
// @description  Toggle experimental features + full promo/unlimited redemption injection + false-value force + honeypot controls
// @author       Grok + Nsomnia (enhanced with your OpenAPI dump)
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
// @connect      s.prod.suno.com
// ==/UserScript==

(function () {
    'use strict';

    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    // ==================== FEATURE GATES (expanded from your OpenAPI JSON) ====================
    const FEATURE_GATES = {
        'agentic-simple': { name: 'Agentic / Orpheus Chat', default: false, enabled: false },
        'orpheus_is_enabled': { name: 'Orpheus Core', default: false, enabled: false },
        'orpheus_is_auto_mode': { name: 'Orpheus Auto', default: false, enabled: false },
        'orpheus_is_canvas_enabled': { name: 'Orpheus Canvas', default: false, enabled: false },
        'orpheus_default_to_chat': { name: 'Default to Chat', default: false, enabled: false },
        'studio': { name: 'Suno Studio Access', default: false, enabled: false },
        'custom_models': { name: 'Custom Models', default: false, enabled: false },
        'negative_tags': { name: 'Negative Tags', default: false, enabled: false },
        'long_uploads': { name: 'Long Uploads (30min)', default: false, enabled: false },
        'convert_audio': { name: 'Audio Convert', default: false, enabled: false },
        'create_control_sliders': { name: 'Control Sliders', default: false, enabled: false },
        'tag_upsample': { name: 'Tag Upsample', default: false, enabled: false },
        'playlist_condition': { name: 'Playlist Condition', default: false, enabled: false },
        'remaster': { name: 'Remaster Tools', default: false, enabled: false },
        'generate_song_video': { name: 'Song Video Gen', default: false, enabled: false },
        'voices-ui': { name: 'Voices UI', default: true, enabled: true },
        'web-omniplayer': { name: 'Omni Player', default: true, enabled: true },
        'unhide-b-side': { name: 'Unhide ALL B-Side / Studio', default: false, enabled: false }
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
            const label = `${cfg.name}: ${enabledGates[g] ? '✅ ON' : '❌ OFF'}`;
            if (menuIds[g]) GM_unregisterMenuCommand(menuIds[g]);
            menuIds[g] = GM_registerMenuCommand(label, () => {
                enabledGates[g] = !enabledGates[g];
                saveGates();
                updateGateMenu();
                if (g === 'unhide-b-side') applyUnhideCSS();
                console.log(`[Suno Toggler] ${g} → ${enabledGates[g]}`);
            });
        });
    }

    // ==================== PROMO / UNLIMITED REDEMPTION INJECTOR ====================
    const UNLTD_PROMO_CODES = [
        "obsidianyouthalt-rehearses-zigzag-desks",
        "arjunsahlot-buys-circular-candles",
        "init-holds-silky-clocks",
        "melancholiccrustpunk532-vocalizes-audible-tomatoes",
        "idyllicrenaissance790-improvises-luxury-kites",
        "purposefulchillout322-climbs-icy-erasers",
        "chloefang95-amplifies-relaxed-unicorns",
        "skythaq-improvises-frozen-windows",
        "peppyarranger174-flips-knitted-clocks",
        "dezknoph-practices-stretchy-planets",
        "s_h_2002-cooks-sturdy-cars",
        "apprehensivelistening845-pulls-colorful-sandals",
        "muey_yeum-amplifies-noisy-doors",
        "bewitchingsextet880-invents-slippery-trains",
        "kikex-sings-ceramic-erasers",
        "hifiaria443-signs-twisted-tomatoes",
        "polaris-draws-mellow-clipboards",
        "unrelentingchurchorgan128-studies-silky-doors",
        "mikeyh-performs-fizzy-burgers",
        "onotrah-gives-shiny-cars",
        "tdawg4ever-harvests-stretchy-desks",
        "traditionalbirdchirp816-tunes-chunky-rugs",
        "distinctchorus065-pulls-pointy-planets",
        "producerdeo-studies-expensive-islands",
        "withdrawnsixteenthnotes724-plays-expensive-elevators",
        "mordantdungeonsynth341-trades-noisy-stairs",
        "oibbio-harmonizes-zigzag-notebooks",
        "princesspandaai-rehearses-pointy-clipboards",
        "avocadotoasties-creates-sturdy-clipboards",
        "phenomenalkeys332-grows-chunky-windows",
        "pungentculture017-hugs-shiny-unicorns",
        "ambiguousbeatbox291-practices-relaxed-socks",
        "blayzeb-reads-neon-doors",
        "uncannyslide094-counts-ceramic-backpacks",
        "divineukulelepunk851-reads-icy-notebooks",
        "mohammadmahdi-studies-circular-chairs",
        "fakhimi-tunes-audible-backpacks",
        "upliftingculture336-rehearses-expensive-chocolates",
        "mindfuldj410-prepares-bubbly-papers",
        "frustratedimmigrant-teaches-frozen-bubbles",
        "yushanglu-amplifies-icy-papers",
        "bhavishyasingla1-pulls-smooth-walnuts",
        "conflagrantaward171-plays-stretchy-umbrellas",
        "onyx7-skips-zigzag-pillows",
        "glamorousmass034-trades-lightweight-rugs",
        "spinninglabel239-improves-bumpy-snowflakes",
        "picatrixpicori-vacuums-relaxed-tables",
        "conflagrantrequiem745-shares-cranky-trains",
        "yellowklaxons030-performs-smooth-doors",
        "drkn-holds-leafy-curtains",
        "yellowfusion555-builds-audible-planets",
        "princess_gangan-draws-rocky-socks",
        "stratosphericresolution873-harmonizes-metallic-balloons",
        "coft-holds-cranky-airplanes",
        "infectiouspianists437-buys-fuzzy-curtains",
        "infectiousheadliners239-helps-bumpy-erasers",
        "abstractfade906-reads-knitted-umbrellas",
        "immovablesounddesigner187-borrows-rocky-backpacks",
        "darksd12-performs-smooth-airplanes",
        "loserdub-builds-ambient-windows",
        "wuenascabro-whistles-glass-airplanes",
        "infectiousmusicjournalist949-buys-jagged-skateboards",
        "shiveringaudioengineer776-teaches-colorful-cereals",
        "chillclicktracks525-cooks-bright-phones",
        "unhurriednocturne833-explores-stretchy-bubbles",
        "dissonantbpm482-rehearses-melted-pizzas",
        "steadyplanez-harmonizes-crunchy-clocks",
        "cmu-amplifies-rough-desks",
        "tantalizingvocoders182-rehearses-twisted-erasers",
        "stereophonictoccata424-draws-audible-cars",
        "calypsoworldtour690-conducts-ambient-pizzas",
        "tommysuno-conducts-metallic-shoes",
        "stingingvisuals829-builds-sturdy-cameras",
        "hypnotizingeclectic082-vocalizes-neon-tables",
        "j4ckflorian-saves-mellow-socks",
        "bluesyaudiodecoder401-improvises-bubbly-stairs",
        "skateboardwonderbred-arranges-silky-carpets",
        "nublarubio-cooks-knitted-clocks",
        "stingingmusictherapist901-carries-luxury-stairs",
        "sensoryroadie856-whistles-knitted-pizzas",
        "twinklingrapmetal121-signs-sturdy-bikes",
        "smomsi-sings-slippery-rugs",
        "rarechimes450-prepares-icy-candles",
        "revolutionaryconductors174-cooks-melted-pizzas",
        "crashingbrainwave502-hums-twisted-chairs",
        "persuasiveelectronica548-borrows-jagged-desks",
        "adrenagong-shares-audible-unicorns",
        "turbulentmanager395-sings-knitted-umbrellas",
        "mistymoon-harmonizes-chunky-backpacks",
        "scotttheis-carries-wooden-waterfalls",
        "adrenalinefueledcodecs717-creates-ambient-unicorns",
        "turbulentcassette204-composes-wavy-erasers",
        "unearthlyambient031-draws-twisted-balloons",
        "jdiaz-holds-shiny-clipboards",
        "adrenalinefueledaudioengineers909-hugs-flat-snowflakes",
        "zhryang-carries-slippery-walnuts",
        "nonconformistdissonance142-cooks-audible-bikes",
        "fathomlessrhyme060-improvises-fluffy-papers",
        "joevio-flips-noisy-elevators",
        "nonconformistgreenroom825-climbs-bubbly-elevators",
        "theboyoutakehometomother-borrows-wooden-clipboards",
        "laqd-practices-bright-notebooks",
        "rsasy_music-shares-cranky-skateboards",
        "mdavol1bing-folds-glass-raindrops",
        "artificialiverson-reads-textured-headphones",
        "medievalcastanets796-saves-neon-stairs",
        "photorealisticduets700-builds-ceramic-clocks",
        "jingtian-draws-bubbly-backpacks",
        "codeine314-skips-oval-shoes",
        "earthlyopera754-folds-oval-elevators",
        "ccb-draws-neon-clocks",
        "unwaveringsoundwave779-draws-rough-balloons",
        "shadowalker_6-harvests-fizzy-curtains",
        "stringentbeat742-shares-melted-trains",
        "cheekycodec157-whistles-fizzy-headphones",
        "melancholicrecordlabels665-improvises-ceramic-bikes",
        "zedpiano-sings-stretchy-lunchboxes",
        "stringentelectroswing764-pushes-wavy-erasers",
        "richant-hums-relaxed-papers",
        "cheekyconcerto475-creates-rough-stairs",
        "druidguitarpick622-plays-wobbly-headphones",
        "astralrecordcollection717-builds-fluffy-waterfalls",
        "ramen55-builds-flimsy-unicorns",
        "wonderfulbaroque903-composes-leafy-curtains",
        "oguzozcanli-draws-oval-waterfalls",
        "olivier-flips-leafy-walnuts",
        "cuttingedgebell653-trades-twisted-curtains",
        "intricatechurchchoir392-flips-bubbly-burgers",
        "operaticcrustgrind773-cooks-luxury-cameras",
        "bebopholograms187-whistles-metallic-bikes",
        "highdefinitionconcert162-buys-flat-raindrops",
        "destinyvarastar-counts-lightweight-cameras",
        "spellbindingsongwriting926-plays-knitted-erasers",
        "highdefinitionharmonicas231-invents-knitted-bubbles",
        "operaticlisteningroom097-composes-shiny-clipboards",
        "rezyon-cooks-smooth-pillows",
        "jaypeedoesmusic-pulls-cranky-candles",
        "swedepino-builds-relaxed-balloons",
        "jav822-folds-circular-kites",
        "braulicio-carries-luxury-burgers",
        "perfectingmathrock752-invents-wobbly-guitars",
        "otherworldlybassists333-shares-twisted-elevators",
        "fastjazzhop417-grows-textured-elevators",
        "geebeezee-pulls-flat-airplanes",
        "perfectingdiamond150-cooks-flimsy-candles",
        "idyllicdynamics630-buys-twisted-balloons",
        "comicalbandpassfilters709-saves-shiny-pillows",
        "iloveaimusic-vocalizes-chunky-carpets",
        "titor-vacuums-colorful-socks",
        "maniccoda826-explores-knitted-lunchboxes",
        "monolithicimprint026-hugs-wobbly-balloons",
        "dartmouthsuno-counts-shiny-pizzas",
        "arabesquechirps686-teaches-textured-islands",
        "jubilantlosslessaudio354-trades-slippery-papers",
        "ackolf-carries-oval-cakes",
        "awhittle2-amplifies-luxury-tomatoes",
        "candiddancers758-improves-colorful-rugs",
        "syphie-trades-luxury-erasers",
        "redimsi-composes-ambient-cakes",
        "christophercardenas-signs-fluffy-balloons",
        "naturalfire579-conducts-ambient-cameras",
        "redhottrio567-reads-crunchy-clipboards",
        "contemplativedubstep844-builds-crunchy-cameras",
        "lalfred-shares-silky-chairs",
        "doggedmicrogenre228-creates-ceramic-trains",
        "syncopatedseapunk974-gives-rough-umbrellas",
        "intensedanceparty457-hugs-expensive-lunchboxes",
        "nainai-lends-twisted-sandals",
        "schwartzz-explores-metallic-candles",
        "incendiarysurfpunk849-improves-metallic-waterfalls",
        "deadpansalsa034-whispers-circular-islands",
        "morrisonjonathan369-vocalizes-bubbly-clipboards",
        "chilledbaroque975-holds-frozen-skateboards",
        "commandingskatepunk437-borrows-sturdy-windows",
        "playfulturntables445-invents-chunky-planets",
        "commandingtune986-grows-knitted-buses",
        "mysteriousbrostep070-draws-silky-phones",
        "highendwhistles831-lends-oval-candles",
        "grubricardo369-lends-colorful-clocks",
        "jamessuno-prepares-jagged-airplanes",
        "mysteriousversion051-climbs-flat-desks",
        "norfnorfnorfnorfnorf-carries-oval-pizzas",
        "psychedelicdjembe883-amplifies-bright-buses",
        "hugekeyboardist269-amplifies-mellow-snowflakes",
        "jackx-sings-ambient-tablets",
        "psychedelicremix752-skips-fuzzy-papers",
        "glamtechnology364-composes-crunchy-skateboards",
        "psychedelicspectrograph759-teaches-luxury-erasers",
        "vitrifuture-composes-wooden-papers",
        "syrupyoperetta669-skips-pointy-clipboards",
        "curiousensemble544-folds-wavy-elevators",
        "cyl-practices-ceramic-clocks",
        "galaxypickle-conducts-flat-clipboards",
        "dontcopymyflow-counts-colorful-guitars",
        "redm4tt007-grows-mellow-bikes",
        "syrupyvoicing268-pushes-stretchy-rugs",
        "syrupyviolin190-explores-fluffy-headphones",
        "fortissimoyodelers724-draws-fuzzy-pizzas",
        "epicidols355-lends-smooth-raindrops",
        "indigovideogame868-prepares-leather-balloons",
        "indigobells624123-carries-wobbly-candles",
        "comfortingsampler408-buys-wobbly-burgers",
        "johnnycage-builds-lightweight-lunchboxes",
        "indomitablemobileapp302-conducts-ambient-headphones",
        "sultryafrobeat662-saves-wavy-tablets",
        "boldsoundwave067-flips-mellow-candles",
        "unbendingcassette842-creates-leafy-clocks",
        "smarthardrock461-creates-circular-planets",
        "forebodingsickwave946-hums-luxury-snowflakes",
        "usernumba1-hugs-flimsy-stairs",
        "mariachivoicing071-amplifies-wobbly-pillows",
        "maximalsurfrock581-conducts-rocky-elevators",
        "maiyamaiya-tunes-pointy-rugs",
        "goalorienteddarkcabaret541-buys-glass-unicorns",
        "jedidiahbreeze-harvests-jagged-raindrops",
        "brucetheterrible-skips-metallic-backpacks",
        "highschoolliars-prepares-circular-doors",
        "fieryhardvapour315-tunes-colorful-cameras",
        "awestruckmodulation037-harmonizes-rough-skateboards",
        "ratonmiguelito-amplifies-rocky-carpets",
        "sonicharpists604-teaches-noisy-umbrellas",
        "pseunonymous-hums-luxury-chairs",
        "motivationalmusicologist673-hugs-flat-backpacks",
        "wildyodelers526-rehearses-leather-bikes",
        "motivationaloctaves225-skips-wobbly-erasers",
        "emotivealbums986-creates-fluffy-clipboards",
        "effervescentimprints477-pulls-ambient-clocks",
        "giddyheavymetal583-helps-knitted-balloons",
        "ambitiousdirge724-draws-shiny-cereals",
        "touchandgo-harvests-jagged-desks",
        "zzq1015-invents-ceramic-cameras",
        "dramaticecho987-rehearses-leafy-rugs",
        "buttaflydbs-performs-wobbly-planets",
        "vieiralima25777-helps-noisy-carpets",
        "mbfp-practices-cranky-doors",
        "gonzauniverso-skips-colorful-phones",
        "buoyantlisteningroom235-studies-flat-shoes",
        "cadengoneblu-gives-chunky-umbrellas",
        "talentedintros406-conducts-icy-backpacks",
        "2zxy_-teaches-ambient-rugs",
        "prelly-practices-wobbly-clocks",
        "empoweringwarpstep721-paints-knitted-phones",
        "neoclassicalguitar050-arranges-expensive-unicorns"
        // Add any more from your dump if needed
    ];

    // ==================== FALSE-VALUE FORCE (interesting booleans) ====================
    const INTERESTING_FALSE_KEYS = [
        'is_vip', 'studio', 'custom_models', 'negative_tags', 'long_uploads',
        'convert_audio', 'create_control_sliders', 'tag_upsample', 'playlist_condition',
        'remaster', 'generate_song_video', 'voices-ui', 'edit_mode', 'persona',
        'can_buy_credit_top_ups', 'commercial_rights', 'get_stems'
    ];

    function forceInterestingTrues(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        for (const key of Object.keys(obj)) {
            if (INTERESTING_FALSE_KEYS.includes(key) && obj[key] === false) {
                obj[key] = true;
                console.log(`[Suno False Hunter] Forced ${key} → true`);
            } else if (typeof obj[key] === 'object') {
                forceInterestingTrues(obj[key]);
            }
        }
        return obj;
    }

    // ==================== FETCH INTERCEPTOR (main magic) ====================
    const originalFetch = win.fetch;
    win.fetch = async function (...args) {
        let url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');

        const response = await originalFetch.apply(this, args);
        const clone = response.clone();

        try {
            let data = await clone.json();

            // === Promo / Unlimited Redemption Injection ===
            if (url.includes('/api/billing/info/')) {
                if (data.unltd_redemptions_promo_codes) {
                    data.unltd_redemptions_promo_codes = [...new Set([...data.unltd_redemptions_promo_codes, ...UNLTD_PROMO_CODES])];
                } else {
                    data.unltd_redemptions_promo_codes = UNLTD_PROMO_CODES;
                }
                // Top inviters (if present)
                if (data.top_inviters_promo_codes) data.top_inviters_promo_codes = UNLTD_PROMO_CODES.slice(0, 5);
                data.top_inviters_credits_per_redemption = 500;
                data.top_inviters_max_rewards = 5000;

                // VIP / Credits boost
                data.is_vip = true;
                data.credits = 9999999;
                data.total_credits_left = 9999999;
                if (data.plan) {
                    data.plan.plan_key = "premier";
                    data.plan.name = "Premier Unlimited (Toggled)";
                    data.plan.level = 30;
                }
                console.log('[Suno Promo Inject] Unlimited codes + VIP applied');
                return new Response(JSON.stringify(data), { status: 200, headers: response.headers });
            }

            // === Statsig / Experiment / Feature Flags ===
            if (url.includes('/api/statsig/experiment/') || url.includes('/v1/rgstr')) {
                if (data.data) {
                    Object.keys(enabledGates).forEach(g => {
                        if (enabledGates[g]) data.data[g] = true;
                    });
                }
                forceInterestingTrues(data);
            }

            // === Persona / Voice endpoints (reduce friction) ===
            if (url.includes('/api/persona/') || url.includes('/api/voice-verification/')) {
                console.log(`[Suno Persona/Voice] Intercepted ${url}`);
                // Could add more aggressive spoofing here if needed
            }

            // === Studio / Other endpoints logging ===
            if (url.includes('studio-api-prod.suno.com') || url.includes('/api/project/')) {
                console.log(`[Suno Studio/Project] ${url}`);
            }

            return new Response(JSON.stringify(data), { status: response.status, headers: response.headers });
        } catch (e) {
            // Not JSON or error → return original
        }

        return response;
    };

    // ==================== HONEYPOT + UNHIDE + MENU ====================
    function applyUnhideCSS() {
        let style = document.getElementById('suno-unhide-bside');
        if (!style) {
            style = document.createElement('style');
            style.id = 'suno-unhide-bside';
            document.head.appendChild(style);
        }
        style.textContent = enabledGates['unhide-b-side'] ? `
            [class*="studio"], [class*="b-side"], [data-testid*="studio"], 
            .studio-*, a[href*="/studio"], a[href*="/b-side"] {
                display: block !important; visibility: visible !important; opacity: 1 !important;
            }
        ` : '';
    }

    function registerHoneypotMenu() {
        GM_registerMenuCommand('🔍 Dump Honeypot', () => {
            console.log(win.honeypot || 'Honeypot not found');
        });
        GM_registerMenuCommand('🚀 Force Geo Challenge', () => {
            if (win.honeypot) win.honeypot.showChallenge({ allow: true });
        });
        // ... (keep your existing honeypot commands)
    }

    const checkSDKs = setInterval(() => {
        if (win.statsig) {
            const orig = win.statsig.checkGate;
            win.statsig.checkGate = (gate) => enabledGates[gate] !== undefined ? enabledGates[gate] : orig.apply(this, arguments);
        }
        if (win.honeypot) clearInterval(checkSDKs);
    }, 200);

    function init() {
        loadGates();
        updateGateMenu();
        registerHoneypotMenu();
        applyUnhideCSS();
        console.log('%c[Suno Toggler 2.2] Loaded – Promo codes injected + False hunter active', 'color:#00ff88;font-weight:bold');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
