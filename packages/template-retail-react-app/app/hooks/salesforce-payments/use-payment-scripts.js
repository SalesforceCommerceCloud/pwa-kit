// hooks/use-payment-scripts.js
import {useEffect, useState} from 'react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const PAYMENT_SCRIPTS = {
    stripe: {
        id: 'stripe-js',
        src: 'https://js.stripe.com/v3/',
        global: 'Stripe'
    },
    paypal: {
        id: 'paypal-js', 
        src: 'https://www.paypal.com/sdk/js?client-id=test&currency=USD&components=buttons,messages',
        global: 'paypal'
    },
    sfp: {
        id: 'sfp-js',
        //src: 'https://localhost/on/demandware.static/Sites-Site/-/-/internal/jscript/sfp.js',
        //src: 'http://localhost:3002/mobify/bundle/development/static/sfp.js',
        src: 'https://localhost/on/demandware.static/Sites-Site/-/-/internal/jscript/sfp/v1/sfp.js',
        global: 'SFPayments',
         // Add this to prevent async chunk loading
        crossorigin: 'anonymous'
    }
}
// TODO: don't need any styles right now
const PAYMENT_STYLES = {
    plaid: {
        id: 'plaid-css',
        href: 'https://localhost/on/demandware.static/Sites-Site/-/-/internal/css/plaid.css'
    }
}

export const usePaymentScripts = (requiredScripts = ['stripe', 'paypal', 'sfp']) => {
    const [scriptsLoaded, setScriptsLoaded] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [loadedScripts, setLoadedScripts] = useState(new Set())

    useEffect(() => {
        console.log('🚨 usePaymentScripts useEffect TRIGGERED')

        const loadPaymentScripts = async () => {
            try {
                setLoading(true)
                
                // Check which scripts are already loaded
                const scriptsToLoad = requiredScripts.filter(scriptName => {
                    const script = PAYMENT_SCRIPTS[scriptName]
                    return script && !window[script.global]
                })
                console.log('Scripts to load:', scriptsToLoad)

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
                
                // Load styles
                //const stylePromises = Object.values(PAYMENT_STYLES).map(loadCSS)

                //await Promise.all([...scriptPromises, ...stylePromises])
                await Promise.all([...scriptPromises])
                
            // IMPORTANT: Only set loaded after verifying globals exist
                const allGlobalsAvailable = requiredScripts.every(scriptName => {
                    const script = PAYMENT_SCRIPTS[scriptName]
                    return script && window[script.global]
                })


                if (allGlobalsAvailable) {
                    console.log('✅ All globals confirmed available')
                    setLoadedScripts(new Set(requiredScripts))
                    setScriptsLoaded(true)
                } else {
                    console.error('❌ Some globals still not available after loading')
                    setError(new Error('Scripts loaded but globals not available'))
                }
            } catch (err) {
                setError(err)
                console.error('Failed to load payment scripts:', err)
            } finally {
                setLoading(false)
            }
        }

        loadPaymentScripts()
    }, [requiredScripts.join(',')]) // Re-run if required scripts change

    const loadScript = (scriptConfig) => {
        console.log(`Loading ${scriptConfig.id}...`)
        return new Promise((resolve, reject) => {
            if (document.getElementById(scriptConfig.id)) {
                console.log(`${scriptConfig.id} already exists`)
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
                console.log(`✅ ${scriptConfig.id} loaded. window.${scriptConfig.global}:`, !!window[scriptConfig.global])
                resolve()
            }
            script.onerror = (error) => {
                console.error(`❌ ${scriptConfig.id} failed:`, error)
                reject(new Error(`Failed to load ${scriptConfig.id}`))
            }
            
            document.body.appendChild(script)
            console.log(`${scriptConfig.id} appended to DOM`)
        })
    }

    const loadCSS = (styleConfig) => {
        return new Promise((resolve) => {
            if (document.getElementById(styleConfig.id)) {
                resolve()
                return
            }

            const link = document.createElement('link')
            link.id = styleConfig.id
            link.type = 'text/css'
            link.href = styleConfig.href
            link.rel = 'stylesheet'
            link.onload = resolve
            document.head.appendChild(link)
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