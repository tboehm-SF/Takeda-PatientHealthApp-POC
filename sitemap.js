/**
 * Zasocitinib Patient App — Data Cloud Web SDK v2 Sitemap
 * Version 1.0 — Behavioral Events + Identity Stitching + Personalization
 *
 * Uses Data Cloud Web SDK v2.0 APIs:
 *   - SalesforceInteractions.init()
 *   - SalesforceInteractions.sendEvent()
 *   - SalesforceInteractions.ConsentStatus
 *   - SalesforceInteractions.setConsent()
 *
 * Connector: Engagement_A4S (CDN ID: 5946dc68-d57d-4c97-ac85-9585dcf43cd7)
 * App: https://takedapatientapp.netlify.app/
 *
 * SPA Architecture:
 *   This is a React SPA with state-based navigation (no URL routing).
 *   Screens: home, checkin, education, progress, support, article
 *   Screen changes are detected via MutationObserver on [data-screen] attributes
 *   and by polling the active navigation tab.
 */

// ─── SDK INITIALIZATION WITH CONSENT ──────────────────
SalesforceInteractions.init({
    consents: [{
        provider: 'ZasocitinibAppConsent',
        purpose: 'Tracking',
        status: SalesforceInteractions.ConsentStatus.OptIn
    }]
}).then(function () {

    // ─── SCREEN DETECTION (SPA — no URL routing) ─────────
    // The patient app uses React state to switch screens.
    // We detect the current screen from the active bottom nav tab
    // and from data attributes set by the app.

    var SCREEN_NAMES = {
        home: 'Home Dashboard',
        checkin: 'Daily Check-In',
        education: 'Education Hub',
        progress: 'Progress Tracker',
        support: 'Support Center',
        article: 'Article Detail'
    };

    var lastTrackedScreen = null;

    function getCurrentScreen() {
        // Try data-screen attribute first (if app sets it)
        var screenEl = document.querySelector('[data-screen]');
        if (screenEl) return screenEl.getAttribute('data-screen');

        // Fall back to detecting active nav tab text
        var activeTab = document.querySelector('.nav-tab.active, .bottom-nav button[class*="active"]');
        if (activeTab) {
            var text = (activeTab.textContent || '').trim().toLowerCase();
            if (text.indexOf('home') !== -1) return 'home';
            if (text.indexOf('check') !== -1) return 'checkin';
            if (text.indexOf('learn') !== -1 || text.indexOf('education') !== -1) return 'education';
            if (text.indexOf('progress') !== -1) return 'progress';
            if (text.indexOf('support') !== -1) return 'support';
        }

        // Default
        return 'home';
    }

    function trackScreenView(screenKey) {
        if (screenKey === lastTrackedScreen) return;
        lastTrackedScreen = screenKey;

        var screenName = SCREEN_NAMES[screenKey] || screenKey;

        // Send page view event
        SalesforceInteractions.sendEvent({
            interaction: {
                name: screenName + ' View',
                eventType: 'websiteEngagement'
            }
        });
    }

    // Track initial screen
    trackScreenView(getCurrentScreen());

    // ─── SPA NAVIGATION OBSERVER ─────────────────────────
    // Poll for screen changes since React state changes don't trigger URL changes
    setInterval(function () {
        var current = getCurrentScreen();
        trackScreenView(current);
    }, 500);

    // Also observe DOM mutations for screen content changes
    var appRoot = document.getElementById('root');
    if (appRoot) {
        var observer = new MutationObserver(function () {
            // Debounce — wait for React to finish rendering
            setTimeout(function () {
                var current = getCurrentScreen();
                trackScreenView(current);
            }, 100);
        });
        observer.observe(appRoot, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }


    // ─── EDUCATION ARTICLE PERSONALIZATION ─────────────────
    // Request personalized article recommendations when user visits Education Hub
    function requestArticlePersonalization() {
        var screenKey = getCurrentScreen();
        if (screenKey !== 'education' && screenKey !== 'home') return;

        SalesforceInteractions.sendEvent({
            interaction: {
                name: 'Article Personalization Request',
                eventType: 'personalizationRequest'
            },
            personalization: {
                personalizationPoints: [{
                    name: 'Zasocitinib_Article_Recommendations_PP'
                }]
            }
        }).then(function (response) {
            try {
                if (response && response.personalizationPoints && response.personalizationPoints.length > 0) {
                    var ppResponse = response.personalizationPoints[0];
                    if (ppResponse && ppResponse.decisions && ppResponse.decisions.length > 0) {
                        // Dispatch custom event with personalization data for the React app to consume
                        var event = new CustomEvent('dc:personalization', {
                            detail: {
                                point: 'Zasocitinib_Article_Recommendations_PP',
                                decisions: ppResponse.decisions
                            }
                        });
                        window.dispatchEvent(event);
                    }
                }
            } catch (e) {
                // Silently fail — static content remains
            }
        }).catch(function () {
            // Silently fail — static content remains
        });
    }


    // ─── IDENTITY STITCHING LISTENER ─────────────────────
    // The React app dispatches 'dc:identity' custom events when the user
    // provides their profile information in the ProfileModal.
    // This bridges the React state → Web SDK identity stitching.

    window.addEventListener('dc:identity', function (e) {
        var data = e.detail || {};

        // 1. websiteEngagement event — tracks the identity action
        SalesforceInteractions.sendEvent({
            interaction: {
                name: 'Form Submit',
                eventType: 'websiteEngagement'
            },
            user: {
                attributes: {
                    eventType: 'contactPointEmail',
                    email: data.email || ''
                }
            }
        });

        // 2. identity event — marks this device as a known user
        SalesforceInteractions.sendEvent({
            interaction: {
                name: 'Identity Capture'
            },
            user: {
                attributes: {
                    eventType: 'identity',
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    email: data.email || '',
                    isAnonymous: false
                }
            }
        });
    });


    // ─── CONSENT CHANGE LISTENER ─────────────────────────
    // Listens for consent changes from the ProfileModal

    window.addEventListener('dc:consent', function (e) {
        var data = e.detail || {};
        var status = data.granted
            ? SalesforceInteractions.ConsentStatus.OptIn
            : SalesforceInteractions.ConsentStatus.OptOut;

        SalesforceInteractions.setConsent([{
            provider: 'ZasocitinibAppConsent',
            purpose: 'Tracking',
            status: status
        }]);

        // Also send a consent event for tracking
        SalesforceInteractions.sendEvent({
            interaction: {
                name: data.granted ? 'Consent Granted' : 'Consent Revoked',
                eventType: 'websiteEngagement'
            }
        });
    });


    // ─── DOSE CONFIRMATION LISTENER ──────────────────────
    // Tracks when the user confirms their daily dose

    window.addEventListener('dc:dose-confirmed', function () {
        SalesforceInteractions.sendEvent({
            interaction: {
                name: 'Dose Confirmed',
                eventType: 'websiteEngagement',
                catalogObject: {
                    type: 'Product',
                    id: 'zasocitinib-15mg',
                    attributes: {
                        name: 'Zasocitinib 15mg',
                        category: 'Medication',
                        therapeuticArea: 'Dermatology'
                    }
                }
            }
        });
    });


    // ─── CHECK-IN SUBMISSION LISTENER ────────────────────
    // Tracks when the user submits their daily health check-in

    window.addEventListener('dc:checkin-submitted', function (e) {
        var data = e.detail || {};

        SalesforceInteractions.sendEvent({
            interaction: {
                name: 'Check-In Submitted',
                eventType: 'websiteEngagement'
            }
        });

        // Request personalized content after check-in
        requestArticlePersonalization();
    });


    // ─── ARTICLE VIEW LISTENER ───────────────────────────
    // Tracks when the user views an article in the Education Hub

    window.addEventListener('dc:article-view', function (e) {
        var data = e.detail || {};

        SalesforceInteractions.sendEvent({
            interaction: {
                name: 'Article View',
                eventType: 'websiteEngagement',
                catalogObject: {
                    type: 'Article',
                    id: data.articleId || 'unknown',
                    attributes: {
                        name: data.title || '',
                        category: data.category || 'Education',
                        contentType: data.contentType || 'Patient Education'
                    }
                }
            }
        });
    });


    // ─── CTA CLICK TRACKING ──────────────────────────────
    // Tracks button and link clicks within the app

    document.addEventListener('click', function (e) {
        var target = e.target.closest('a, button');
        if (!target) return;

        var text = (target.textContent || '').trim().substring(0, 100);
        var isButton = target.tagName === 'BUTTON';

        // Skip navigation tabs (tracked separately as screen views)
        if (target.closest('.bottom-nav, .nav-tab')) return;

        // Skip profile modal close button
        if (target.closest('.d360-close, .d360-badge')) return;

        if (text) {
            SalesforceInteractions.sendEvent({
                interaction: {
                    name: isButton ? 'Button Click: ' + text : 'Link Click: ' + text,
                    eventType: 'websiteEngagement'
                }
            });
        }
    });


    // ─── ENGAGED VISIT TIMERS ────────────────────────────
    // Track how long the user stays engaged with the app

    setTimeout(function () {
        SalesforceInteractions.sendEvent({
            interaction: {
                name: 'Engaged Visit (15s)',
                eventType: 'websiteEngagement'
            }
        });
    }, 15000);

    setTimeout(function () {
        SalesforceInteractions.sendEvent({
            interaction: {
                name: 'Engaged Visit (1m)',
                eventType: 'websiteEngagement'
            }
        });
    }, 60000);

    setTimeout(function () {
        SalesforceInteractions.sendEvent({
            interaction: {
                name: 'Engaged Visit (2m)',
                eventType: 'websiteEngagement'
            }
        });
    }, 120000);


    // ─── SUPPORT CHAT LISTENER ───────────────────────────
    // Tracks when the user opens the Agentforce chat

    window.addEventListener('dc:support-chat-opened', function () {
        SalesforceInteractions.sendEvent({
            interaction: {
                name: 'Agentforce Chat Opened',
                eventType: 'websiteEngagement'
            }
        });
    });

});
