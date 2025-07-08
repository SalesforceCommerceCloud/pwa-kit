import {useState, useEffect, useRef} from 'react'
import {usePaymentScripts} from './use-payment-scripts'

export const useSalesforcePayments = (scriptsLoaded, hasSFP) => {
    //const {scriptsLoaded, hasSFP} = usePaymentScripts(['stripe', 'paypal', 'sfp'])
    const [sfpInstance, setSfpInstance] = useState(null)
    const [isInitialized, setIsInitialized] = useState(false)
    const [initError, setInitError] = useState(null)
    const sfpRef = useRef(null)

    useEffect(() => {
        const initializeSFP = async () => {
            console.log('SFP Hook - checking conditions:', {
                scriptsLoaded,
                hasSFP,
                windowSFPayments: !!window.SFPayments,
                alreadyInitialized: !!sfpRef.current
            })
            // Only initialize if scripts are loaded and SFP is available
            if (!scriptsLoaded || !hasSFP || !window.SFPayments || sfpRef.current) {
                return
            }

            try {
                console.log('🚀 Initializing SFP...')
                setInitError(null)
                
                // Initialize SFP instance
                const sfp = new window.SFPayments()
                
                // Store in ref for cleanup and avoid re-initialization
                sfpRef.current = sfp
                setSfpInstance(sfp)
                setIsInitialized(true)
                
                console.log('SFP initialized successfully:', sfp)
            } catch (error) {
                console.error('Failed to initialize SFP:', error)
                setInitError(error)
                setIsInitialized(false)
            }
        }

        initializeSFP()
    }, [scriptsLoaded, hasSFP])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (sfpRef.current) {
                // Add any cleanup logic if SFP has destroy/cleanup methods
                // sfpRef.current.destroy?.()
                sfpRef.current = null
                setSfpInstance(null)
                setIsInitialized(false)
            }
        }
    }, [])

    return {
        sfpInstance,
        isInitialized,
        initError,
        isLoading: scriptsLoaded && hasSFP && !isInitialized && !initError
    }
}