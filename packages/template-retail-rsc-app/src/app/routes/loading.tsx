'use client'

import {useEffect, useRef, useState} from 'react'
import {useNavigation} from 'react-router'

/**
 * Loading indicator optimized for React Server Components (RSC). The indicator shows a loading
 * state whenever the navigation state diverges from "idle" for more than 150ms. It's implemented
 * to do this only for client-side (follow-up) navigation requests, but not for the initial SSR
 * page load.
 */
export default function Loading() {
    const navigation = useNavigation()
    const timeout = useRef<NodeJS.Timeout | null>(null)
    const [showLoader, setShowLoader] = useState(false)

    useEffect(() => {
        timeout.current && clearTimeout(timeout.current)
        if (navigation.state === 'idle') {
            setShowLoader(false)
        } else {
            timeout.current = setTimeout(() => setShowLoader(false), 150)
        }

        return () => {
            timeout.current && clearTimeout(timeout.current)
            setShowLoader(false)
        }
    }, [navigation.state])

    if (showLoader) {
        return (
            <div className="w-full h-full fixed top-0 left-0 bg-white opacity-75 z-50">
                <div className="flex justify-center items-center mt-[50vh]">
                    <div className="border-gray-300 h-20 w-20 animate-spin rounded-full border-8 border-t-blue-600" />
                </div>
            </div>
        )
    }
    return null
}
