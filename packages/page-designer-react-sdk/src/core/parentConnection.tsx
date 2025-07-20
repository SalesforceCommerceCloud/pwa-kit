import {useCallback, useEffect} from 'react'

export function useParentConnection(
    active: boolean,
    onMessage?: (event: MessageEvent) => void
) {
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top

    const sendMessage = useCallback(
        (mType: string, mBody?: any) => {
            if (active && isInIframe) {
                window.parent.postMessage({mType, mBody}, '*')
            }
        },
        [active, isInIframe]
    )

    useEffect(() => {
        if (!active || !isInIframe) return
        sendMessage('storefront-ready')
    }, [active, isInIframe, sendMessage])

    useEffect(() => {
        if (!active || !isInIframe || !onMessage) return

        window.addEventListener('message', onMessage)
        return () => {
            window.removeEventListener('message', onMessage)
        }
    }, [active, isInIframe, onMessage])

    return {sendMessage}
}
