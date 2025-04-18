/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { useEffect, useState } from 'react';

const onClient = typeof window !== 'undefined';

// Function to register event listeners
const registerEventListeners = (siteId, slasToken, basketId, domainUrl) => {
    if (!onClient) return;

    const onReadyHandler = (e) => {
        console.log("Received the onEmbeddedMessagingReady event…", e);
        window.embeddedservice_bootstrap.prechatAPI.setHiddenPrechatFields({
            "Site_ID": siteId,
            "SLAS_TOKEN": slasToken,
            "Basket_ID": basketId,
            "Domain_URL": domainUrl,
        });
    };

    window.addEventListener("onEmbeddedMessagingReady", onReadyHandler);

   return [
        { event: "onEmbeddedMessagingReady", handler: onReadyHandler }
    ];
};

// Function to initialize embedded messaging
const initEmbeddedMessaging = (messaging, orgId, esdName, esdUrl, scrt2Url) => {
    try {
        if (onClient && messaging && messaging?.embeddedservice_bootstrap?.settings) {
            messaging.embeddedservice_bootstrap.settings.language = 'en_US';
            messaging.embeddedservice_bootstrap.init(
                orgId,
                esdName,
                esdUrl,
                {
                    scrt2URL: scrt2Url
                }
            );
        }
    } catch (err) {
        console.error('Error initializing Embedded Messaging: ', err);
    }
};

/**
 * Custom hook to handle embedded messaging initialization
 * @param {string} siteId - The site ID for the embedded messaging script
 * @param {string} slasToken - The SLAS token for the embedded messaging script
 * @param {string} basketId - The basket ID for the embedded messaging script
 * @param {string} domainUrl - The domain URL for the embedded messaging script
 * @param {string} src - The source URL for the embedded messaging script
 * @returns {Object} The embedded messaging object
 */
const useMiaw = (orgId, esdName, esdUrl, scrt2Url, siteId, slasToken, basketId = '', domainUrl, src) => {
    const [embeddedMessaging, setEmbeddedMessaging] = useState(null);
    const [isMiawInitialized, setIsMiawInitialized] = useState(false);
    
    // Effect to load and initialize the script
    useEffect(() => {
        let miawEventListeners = [];

        if (!src && !siteId) {
            setEmbeddedMessaging(null);
            return;
        }
        
        // Check if script already exists
        let script = document.querySelector(`script[src="${src}"]`);
        
        if (!script) {
            script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.setAttribute("data-status", "loading");
            document.body.appendChild(script);
            
            const setAttributeFromEvent = (event) => {
                script.setAttribute(
                    "data-status",
                    event.type === "load" ? "ready" : "error"
                );
            };
            
            script.addEventListener("load", setAttributeFromEvent);
            script.addEventListener("error", setAttributeFromEvent);
        }
        
        const setStateFromEvent = (event) => {
            const loaded = event.type === "load";
            if (loaded) {
                const messaging = {
                    embeddedservice_bootstrap: window.embeddedservice_bootstrap,
                    settings: window.embeddedservice_bootstrap.settings,
                    prechatAPI: window.embeddedservice_bootstrap.prechatAPI,
                    init: window.embeddedservice_bootstrap.init,
                    error: false
                };
                
                setEmbeddedMessaging(messaging, orgId, esdName, esdUrl, scrt2Url);
                
                // Initialize embedded messaging if not already initialized
                if (!isMiawInitialized) {
                    miawEventListeners = registerEventListeners(siteId, slasToken, basketId, domainUrl);
                    initEmbeddedMessaging(messaging);
                    setIsMiawInitialized(true);
                }
            } else {
                setEmbeddedMessaging({
                    error: true
                });
            }
        };
        
        script.addEventListener("load", setStateFromEvent);
        script.addEventListener("error", setStateFromEvent);
        
        // Cleanup function to remove script event listeners
        return () => {
            if (script) {
                script.removeEventListener("load", setStateFromEvent);
                script.removeEventListener("error", setStateFromEvent);
            }

            // TODO: Remove embedded messaging event listeners
            // currently in dev mode the listeners get removed inadvertenly
            // Remove embedded messaging event listeners
            // if (miawEventListeners.length > 0) {
            //     miawEventListeners.forEach(({ event, handler }) => {
            //         window.removeEventListener(event, handler);
            //     });
            // }
        };
    }, [isMiawInitialized, embeddedMessaging, siteId, domainUrl]);
    
    return embeddedMessaging;
};

export default useMiaw;