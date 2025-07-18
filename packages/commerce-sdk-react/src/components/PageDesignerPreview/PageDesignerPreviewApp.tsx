/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import {IntlProvider} from 'react-intl'
import {PageDesignerPreview, PreviewInterface} from './index'
import type {PageDesignerPreviewConfiguration, PageDesignerPreviewContext} from './types'

interface PageDesignerPreviewAppProps {
    getToken: () => string | undefined | Promise<string | undefined>
}

export const PageDesignerPreviewApp: React.FC<PageDesignerPreviewAppProps> = ({getToken}) => {
    const [configuration, setConfiguration] = useState<PageDesignerPreviewConfiguration | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchConfiguration = async () => {
            try {
                setLoading(true)
                
                // Fetch the experience editor configuration
                const response = await fetch('/dw/bm/v1/experience_editor_configuration/preview', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await getToken()}`
                    }
                })

                if (!response.ok) {
                    throw new Error(`Failed to fetch configuration: ${response.status}`)
                }

                const config = await response.json()
                setConfiguration(config)
            } catch (err) {
                console.error('Error fetching configuration:', err)
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }

        fetchConfiguration()
    }, [getToken])

    const handleContextChange = async (context: PageDesignerPreviewContext) => {
        try {
            // Send context to backend
            await fetch('/dw/bm/v1/experience_editor_preview_context', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await getToken()}`
                },
                body: JSON.stringify(context)
            })
        } catch (err) {
            console.error('Error updating preview context:', err)
        }
    }

    const handleNavigationChange = (path: string) => {
        console.log('Navigation changed to:', path)
        // This could be used to update the iframe URL or handle navigation
    }

    if (loading) {
        return (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <div>Loading preview configuration...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <div>Error: {error}</div>
            </div>
        )
    }

    if (!configuration) {
        return (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <div>No configuration available</div>
            </div>
        )
    }

    return (
        <IntlProvider locale="en-US" messages={{}}>
            <PageDesignerPreview
                enabled={true}
                getToken={getToken}
                onContextChange={handleContextChange}
            >
                <PreviewInterface
                    configuration={configuration}
                    onContextChange={handleContextChange}
                    onNavigationChange={handleNavigationChange}
                />
            </PageDesignerPreview>
        </IntlProvider>
    )
}

export default PageDesignerPreviewApp 