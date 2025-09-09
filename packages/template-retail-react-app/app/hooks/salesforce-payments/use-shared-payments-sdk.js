import { useState, useEffect, useRef } from 'react'
import { usePaymentScripts } from './use-payment-scripts'

// Module-level shared state (outside React)
let globalSFPInstance = null
let initializationPromise = null
let subscribers = new Set()

const notifySubscribers = (instance) => {
    subscribers.forEach(callback => callback(instance))
}

export const useSharedSFPInstance = () => {
    const [sfpInstance, setSfpInstance] = useState(globalSFPInstance)
    const [isReady, setIsReady] = useState(!!globalSFPInstance)
    const { scriptsLoaded, loading, hasSFP } = usePaymentScripts(['sfp'])
    
    /*
        Note: window usage is acceptable in this case because it is used in the useEffect hook
        and useEffect only runs on the client side, else window will not work in SSR
    */

    // a subscription based approach to get the shared SFP instance   
    useEffect(() => {
        // Subscribe to instance updates
        
        // When the shared SFP instance becomes available, update local state so that components can use it
        const handleInstanceUpdate = (instance) => {
            setSfpInstance(instance)
            setIsReady(instance !== null && instance !== undefined)
        }
        
        subscribers.add(handleInstanceUpdate)
        
        // If instance already exists, use it
        if (globalSFPInstance) {
            handleInstanceUpdate(globalSFPInstance)
            return () => subscribers.delete(handleInstanceUpdate)
        }
        
        // Create instance if scripts are ready and no instance exists
        if (scriptsLoaded && hasSFP && typeof window !== 'undefined' && window.SFPayments && !globalSFPInstance && !initializationPromise) {
            initializationPromise = createSFPInstance()
        }
        
        return () => subscribers.delete(handleInstanceUpdate)
    }, [scriptsLoaded, hasSFP])
    
    return { sfpInstance, isReady, loading, scriptsLoaded, hasSFP }
}

const createSFPInstance = async () => {
    try {
        const sfp = new window.SFPayments()  
        globalSFPInstance = sfp
        notifySubscribers(sfp)
        
    } catch (error) {
        console.error('❌ Failed to create shared SFP instance:', error)
    } finally {
        initializationPromise = null
    }
}

// Cleanup function for when no components need SFP
export const cleanupSFPInstance = () => {
    if (globalSFPInstance && subscribers.size === 0) {
        globalSFPInstance = null
        initializationPromise = null
    }
}

/*
import { useSharedSFPInstance } from '../../../../hooks/salesforce-payments/use-shared-sfp-instance'

const SFPaymentsExpress = ({ paymentState }) => {
    const { sfpInstance, isReady: sfpReady } = useSharedSFPInstance()
    
    // ... rest of component logic
}
The custom hook approach is best because:
✅ No context pollution - doesn't affect other pages
✅ Automatic cleanup - instance cleaned up when no components use it
✅ Simple to use - just import the hook where needed
✅ No provider wrapping - works anywhere
✅ Performance - only loads when payment components mount
✅ Reusable - can be used on PDP, cart, anywhere
This gives you the benefits of shared state without the downsides of app-wide context.
Which approach do you prefer?


1. Checkout page loads → PaymentExpress uses hook → Creates global SFP instance
2. User goes to PDP → PaymentExpress uses hook → Reuses same global instance  
3. User goes to Cart → PaymentExpress uses hook → Reuses same global instance

or 
1. PDP loads → PaymentExpress uses hook → Creates global SFP instance
2. User goes to Cart → PaymentExpress uses hook → Reuses same instance
3. User goes to Checkout → Both components use hook → Reuse same instance

Benefits of This Approach:
✅ Performance Benefits:
No re-initialization - SFP instance created once, reused everywhere
Faster page loads - subsequent pages don't need to recreate SFP
Less memory usage - single instance vs multiple instances
✅ Consistency:
Same SFP configuration across all pages
Shared error handling
Consistent behavior

// Both components use the same shared instance
<SFPaymentsExpress paymentState={paymentConfigState} />
<SFPaymentsSheet paymentState={paymentConfigState} />


s This Good or Bad?
✅ Good for your use case because:
SFP is expensive to initialize - you want to do it once
Consistent payment experience across pages
Better performance - no re-initialization delays
Simpler state management - one source of truth
⚠️ Potential considerations:
Global state - instance persists across page navigation
Memory usage - instance stays in memory (but this is usually negligible)
Configuration changes - if different pages need different SFP config, you'd need to handle that

*/