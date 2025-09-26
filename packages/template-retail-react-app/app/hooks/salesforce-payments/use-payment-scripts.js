// hooks/use-payment-scripts.js
import {useEffect, useState} from 'react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import { buildStaticResourceBaseUrl } from '../../utils/salesforce-payments/static-resource-utils.js'

// Helper function to build the SFP script URL for unified domains
const buildSFPScriptUrl = () => {


       
    const baseUrl = buildStaticResourceBaseUrl()
    const scriptUrl = `${baseUrl}/jscript/sfp/v1/sfp.js`
    //console.log('scriptUrl', scriptUrl)
    return scriptUrl               
    //temporary code until sfp chunks load correctly
    //return `https://localhost/on/demandware.static/Sites-Site/-/-/internal/jscript/sfp/v1/sfp.js`
}

const PAYMENT_SCRIPTS = {
    sfp: {
        id: 'sfp-js',
        src: buildSFPScriptUrl(), // This will generate: https://zyoe-002.unified.demandware.net/on/demandware.static/Sites-RefArch/-/-/internal/jscript/sfp/v1/sfp.js
        //src: 'https://localhost/on/demandware.static/Sites-Site/-/-/internal/jscript/sfp/v1/sfp.js',
        global: 'SFPayments',
         // Add this to prevent async chunk loading
        crossorigin: 'anonymous'
    }
}

export const usePaymentScripts = (requiredScripts = ['sfp']) => {
//export const usePaymentScripts = (requiredScripts = ['stripe', 'paypal', 'sfp']) => {
    const [scriptsLoaded, setScriptsLoaded] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [loadedScripts, setLoadedScripts] = useState(new Set())

    useEffect(() => {
        
        const loadPaymentScripts = async () => {
            try {
                setLoading(true)
                
                // Check which scripts are already loaded
                const scriptsToLoad = requiredScripts.filter(scriptName => {
                    const script = PAYMENT_SCRIPTS[scriptName]
                    return script && !window[script.global]
                })
                if (scriptsToLoad.length === 0) {
                    setScriptsLoaded(true)
                    setLoadedScripts(new Set(requiredScripts))
                    setLoading(false)
                    return
                }

                // Load required scripts
                const scriptPromises = scriptsToLoad.map(scriptName => 
                    loadScript(PAYMENT_SCRIPTS[scriptName])
                )
                
                await Promise.all([...scriptPromises])
                
            // IMPORTANT: Only set loaded after verifying globals exist
                const allGlobalsAvailable = requiredScripts.every(scriptName => {
                    const script = PAYMENT_SCRIPTS[scriptName]
                    return script && window[script.global]
                })


                if (allGlobalsAvailable) {
                    setLoadedScripts(new Set(requiredScripts))
                    setScriptsLoaded(true)
                } else {
                    setError(new Error('Scripts loaded but globals not available'))
                }
            } catch (err) {
                setError(err)
            } finally {
                setLoading(false)
            }
        }

        loadPaymentScripts()
    }, [requiredScripts.join(',')]) // Re-run if required scripts change

    const loadScript = (scriptConfig) => {
        return new Promise((resolve, reject) => {
            if (document.getElementById(scriptConfig.id)) {
                resolve()
                return
            }

            const script = document.createElement('script')
            script.id = scriptConfig.id
            script.src = scriptConfig.src
            //script.async = true
            script.type = 'text/javascript'  // ✅ Add type attribute
            script.charset = 'utf-8'         // ✅ Add charset attribute
            script.onload = () => {
                resolve()
            }
            script.onerror = (error) => {
                reject(new Error(`Failed to load ${scriptConfig.id}`))
            }
            
            document.body.appendChild(script)
        })
    }
    return {
        scriptsLoaded,
        loading,
        error,
        loadedScripts,
        // Helper functions for specific payment methods
        hasStripe: loadedScripts.has('stripe'),
        hasPaypal: loadedScripts.has('paypal'),
        hasSFP: loadedScripts.has('sfp')
    }
}