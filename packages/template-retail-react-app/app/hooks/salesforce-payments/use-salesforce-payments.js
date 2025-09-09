import {useState, useEffect, useRef} from 'react'
import {usePaymentScripts} from './use-payment-scripts'

//TODO: Remove this hook and use the shared SFP instance instead
export const useSalesforcePayments = (scriptsLoaded, hasSFP) => {
    //const {scriptsLoaded, hasSFP} = usePaymentScripts(['stripe', 'paypal', 'sfp'])
    const [sfpInstance, setSfpInstance] = useState(null)
    const [isInitialized, setIsInitialized] = useState(false)
    const [initError, setInitError] = useState(null)
    const sfpRef = useRef(null)

    useEffect(() => {
        const initializeSFP = async () => {
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
            } catch (error) {
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