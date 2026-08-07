/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const sites = require('./sites.js')
const {parseSettings, validateOtpTokenLength} = require('./utils.js')

module.exports = {
    app: {
        // MRT Data Store (opt-in): when true, SSR resolves prefs and serializes `__MRT_DATA_STORE__` in
        // `#mobify-data`; when false, that key is omitted. See `isMrtDataStoreEnabled` in pwa-kit-runtime.
        // Set `PWAKIT_MRT_DATA_STORE_ENABLED=true|false` to override without editing files.
        // Local dev without DynamoDB: use `MRT_DATA_STORE_DEFAULTS` (JSON map of full DAL keys → objects)
        // and optional `MRT_DATA_STORE_WARN_ON_MISSING=false`. Local data store provided by
        // @salesforce/mrt-utilities via conditional exports (automatic in development mode).
        // Demo page + scripted env: `npm run start:mrt-data-store-demo` in this package, route `/demo/mrt-data-store`.
        mrtDataStore: {
            enabled: false
        },
        commerceAgent: parseSettings(process.env.COMMERCE_AGENT_SETTINGS) || {
            enabled: 'false',
            askAgentOnSearch: 'false',
            embeddedServiceName: '',
            embeddedServiceEndpoint: '',
            scriptSourceUrl: '',
            scrt2Url: '',
            salesforceOrgId: '',
            commerceOrgId: '',
            siteId: '',
            enableConversationContext: 'false',
            conversationContext: [],
            // Widget provider: 'miaw' (default, Salesforce Embedded Messaging) or
            // 'commerce-client' (Commerce Client widget). Selecting 'commerce-client' uses the
            // fields below instead of the MIAW embedded-service fields above.
            provider: 'miaw',
            // Cimulate CDN version of the Commerce Client messaging UMD bundle (e.g.
            // '1.18.0'). Resolved into
            // https://cdn.search.cimulate.ai/copilot-widget/<version>/messaging.umd.js.
            // Only used when provider === 'commerce-client'.
            cc_cdnVersion: '',
            // Optional explicit bundle URL. Overrides cc_cdnVersion when set; use for local
            // dev (http://localhost:...) or an SFCC self-hosted bundle.
            commerceClientScriptSourceUrl: '',
            // Embedded Service developer name for the Commerce Client widget. Falls back
            // to embeddedServiceName when not set.
            cc_esDeveloperName: '',
            // Header text shown at the top of the Commerce Client widget.
            cc_headerText: '',
            // Markdown disclaimer shown in the Commerce Client widget. Supports links and
            // basic markdown (e.g. 'This is AI. See [details](https://example.com).').
            cc_disclaimerMarkdown: '',
            // When 'true' (default) the widget renders as a full-height side panel
            // docked to the configured corner; when 'false' it renders as a standard
            // floating corner dialog. Forwarded to the widget as `dialogFullHeight`.
            cc_dialogFullHeight: 'true',
            // Width of the side panel when cc_dialogFullHeight is 'true'.
            cc_dialogWidth: '420px',
            // Corner the widget docks to: 'bottom-left' or 'bottom-right' (default).
            // Forwarded to the widget as `dialogPosition`.
            cc_widgetPosition: 'bottom-right',
            // When 'true', a floating action button is rendered at cc_widgetPosition.
            // Clicking it opens the Commerce Client shopping agent. Defaults to 'false'.
            cc_showFab: 'false',
            // When 'true', storefront content shifts aside for the open side panel
            // instead of being overlaid by it. Handled template-side by
            // useCommerceClientPagePush; needs an enabled agent on a full-height
            // dialog widget (cc_dialogFullHeight 'true') and `lg`+ width.
            cc_pagePush: 'false',
            // Optional URL of a logo shown in the widget, forwarded as `logoUrl`.
            cc_logoUrl: '',
            // When 'true', the widget opens automatically as the page loads. Forwarded
            // to the widget as `componentConfig.isOpen`. Defaults to 'false'.
            cc_isOpen: 'false',
            // When 'true', the widget logs its events to the console. Forwarded to the
            // widget as `isDevelopment`. Defaults to 'false'.
            cc_isDevelopment: 'false',
            // When 'true', shoppers can escalate the conversation to a human agent.
            // Forwarded as `messagingConfig.enableEscalationToAgent`. Defaults to 'false'.
            cc_enableEscalationToAgent: 'false',
            // When 'true' (default), shoppers can download the chat transcript.
            // Forwarded as `messagingConfig.enableDownloadTranscript`.
            cc_enableDownloadTranscript: 'true',
            // Optional URL to customer's component override script. Must use HTTPS;
            // a non-HTTPS or malformed URL is dropped and the widget keeps its defaults.
            // The script defines Web Components that replace default product cards, carousels,
            // and custom action payloads. See Commerce Client override documentation.
            // This origin is added to the `script-src` CSP directive in app/ssr.js, otherwise
            // the browser blocks the script before it can register window.CimulateOverrides.
            // Serving the script from a host other than the one configured here (for example
            // when the URL varies per environment) means adding that hostname to `script-src`
            // in app/ssr.js yourself.
            cc_overridesUrl: ''
            // Optional: pass `cc_searchConfig` (object) via COMMERCE_AGENT_SETTINGS
            // to customize the widget search input. Forwarded to the widget as
            // `searchConfig`: { placeholder, buttonLabel, buttonType, buttonIconUrl }.
            // Optional: pass `cc_theme` (object) via COMMERCE_AGENT_SETTINGS to override
            // the widget theme (primaryColor, secondaryColor, backgroundColor, fontColor,
            // borderColor, fontFamily).
            // Optional: pass `cc_routingAttributes` (object) via COMMERCE_AGENT_SETTINGS to
            // forward Agentforce routing attributes to the widget as `routingAttributes`.
            // Optional: pass `cc_overrides` (object) via COMMERCE_AGENT_SETTINGS to map widget
            // override keys (e.g. `ProductTile`) to custom element tag names, such as
            // {"ProductTile": "my-product-tile"}. Forwarded to the widget as `overrides`. The
            // elements must already be registered with customElements.define() before the widget
            // injects. Mutually exclusive with `cc_overridesUrl` — set one or the other, not
            // both; when both are set `cc_overrides` wins and the URL is ignored.
        },
        url: {
            site: 'path',
            locale: 'path',
            showDefaults: true,
            showBasePath: false,
            interpretPlusSignAsSpace: false
        },
        login: {
            // The length of the token for OTP authentication. Used by passwordless login and reset password.
            // If the env var `OTP_TOKEN_LENGTH` is set, it will override the config value. Valid values are 6 or 8. Defaults to: 8
            tokenLength: validateOtpTokenLength(process.env.OTP_TOKEN_LENGTH),
            passwordless: {
                enabled: false,
                mode: 'email',
                landingPath: '/passwordless-login-landing'
            },
            social: {
                enabled: false,
                idps: ['google', 'apple'],
                redirectURI: process.env.SOCIAL_LOGIN_REDIRECT_URI || '/social-callback'
            },
            resetPassword: {
                mode: 'email',
                landingPath: '/reset-password-landing'
            }
        },
        defaultSite: 'RefArchGlobal',
        siteAliases: {
            RefArch: 'us',
            RefArchGlobal: 'global'
        },
        sites,
        commerceAPI: {
            proxyPath: `/mobify/proxy/api`,
            parameters: {
                clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
                organizationId: 'f_ecom_zzrf_001',
                shortCode: '8o7m175y',
                siteId: 'RefArchGlobal'
            }
            // Optional: Set the domain for auth cookies to share them across subdomains.
            // If not set, cookies default to the current host.
            // cookieDomain: '.example.com'
        },
        einsteinAPI: {
            host: 'https://api.cquotient.com',
            einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            // This differs from the siteId in commerceAPIConfig for testing purposes
            siteId: 'aaij-MobileFirst',
            isProduction: false
        },
        dataCloudAPI: {
            appSourceId: '7ae070a6-f4ec-4def-a383-d9cacc3f20a1',
            tenantId: 'g82wgnrvm-ywk9dggrrw8mtggy.pc-rnd'
        },
        // One Click Checkout: When enabled, shoppers using passwordless OTP login can save shipping
        // and payment information for faster checkout in the future. To use, enable the flag and
        // configure private SLAS client. Security safeguards required:
        // 1. Captcha - Protects the passwordless login from bots (e.g., Cloudflare Turnstile).
        // 2. OTP for Email Changes - Verifies identity before an email update, prevents accidental
        //    account lockouts from typos, and prevents unauthorized access to saved payment methods.
        oneClickCheckout: {
            enabled: false
        },
        partialHydrationEnabled: false,
        pages: {
            cart: {
                groupBonusProductsWithQualifyingProduct: true
            },
            maintenancePage: {
                // When true (default), the maintenance page is fetched from the CDN URL below
                // and rendered as-is. Set to false to display the built-in maintenance message.
                sharedMaintenancePage: true,
                cdnUrl: 'https://prd.cmp.cdn.commercecloud.salesforce.com',
                forwardedHost: ''
            }
        },
        storeLocatorEnabled: true,
        multishipEnabled: true,
        // Salesforce Payments configuration
        // Set enabled to true to enable Salesforce Payments (requires the Salesforce Payments feature toggle to be enabled on the Commerce Cloud instance).
        // Set enabled to false to disable Salesforce Payments on the storefront (the Commerce Cloud feature toggle is unaffected).
        // Set the sdkUrl and metadataUrl values to point to your Commerce Cloud instance host by replacing the [bm_or_vanity_host] placeholder with your Business Manager or vanity URL host name.
        //   sdkUrl:       'https://[bm_or_vanity_host]/on/demandware.static/Sites-Site/-/-/internal/jscript/sfp/v3/sfp.js'
        //   metadataUrl:  'https://[bm_or_vanity_host]/on/demandware.static/Sites-Site/-/-/internal/metadata/v1.json'
        sfPayments: {
            enabled: false,
            sdkUrl: '',
            metadataUrl: ''
        },
        googleCloudAPI: {
            apiKey: process.env.GOOGLE_CLOUD_API_KEY
        }
    },
    externals: [],
    pageNotFoundURL: '/page-not-found',
    ssrEnabled: true,
    ssrOnly: ['ssr.js', 'ssr.js.map', 'node_modules/**/*.*'],
    ssrShared: [
        'static/ico/favicon.ico',
        'static/robots.txt',
        '**/*.js',
        '**/*.js.map',
        '**/*.json'
    ],
    ssrParameters: {
        ssrFunctionNodeVersion: '24.x',
        // Store the session cookies as HttpOnly for enhanced security.
        // WIP: Do not enable. This feature is in-progress.
        enableHttpOnlySessionCookies: false,
        proxyConfigs: [
            {
                host: 'kv7kzm78.api.commercecloud.salesforce.com',
                path: 'api'
            },
            {
                host: 'zzrf-001.dx.commercecloud.salesforce.com',
                path: 'ocapi'
            }
        ]
    }
}
