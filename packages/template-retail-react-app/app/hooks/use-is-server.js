import {useState, useEffect} from 'react'

/**
 * Hook to determine if the code is running on the server or the client.
 * Solution for hydration issues with SSR.
 * @returns {boolean} true if the code is running on the server, false if the code is running on the client.
 */
export const useIsServer = () => {
    const [isServer, setIsServer] = useState(true)

    useEffect(() => {
        setIsServer(false)
    }, [])

    return isServer
}
