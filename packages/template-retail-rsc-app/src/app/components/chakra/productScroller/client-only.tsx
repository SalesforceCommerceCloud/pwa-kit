'use client'
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect} from 'react'

// Client-only wrapper that conditionally imports Chakra components
const ChakraProductScrollerClientOnly = (props: {title?: string; [key: string]: any}) => {
    const [isClient, setIsClient] = useState(false)
    const [ChakraComponent, setChakraComponent] = useState<React.ComponentType<any> | null>(null)

    useEffect(() => {
        setIsClient(true)
        // Dynamically import the Chakra island only on the client
        import('./island').then((module) => {
            setChakraComponent(() => module.default)
        })
    }, [])

    // Don't render anything until we're on the client
    if (!isClient || !ChakraComponent) {
        return (
            <div className="py-16">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex space-x-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({length: 4}).map((_, i) => (
                            <div key={i} className="flex-none w-60 md:w-72">
                                <div className="aspect-square bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
                                <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                                <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return <ChakraComponent {...props} />
}

ChakraProductScrollerClientOnly.displayName = 'ChakraProductScrollerClientOnly'

export default ChakraProductScrollerClientOnly
