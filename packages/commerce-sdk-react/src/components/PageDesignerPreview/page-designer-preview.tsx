/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState, useRef} from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {useHistory, useLocation} from 'react-router-dom'
import {useIntl} from 'react-intl'
import {useCommerceApi, useConfig} from '../../hooks'
import {detectPageDesignerPreview, getPageDesignerClientScript} from './utils'
import type {PageDesignerPreviewContext, PageDesignerPreviewDevice} from './types'

type GetToken = () => string | undefined | Promise<string | undefined>
type ContextChangeHandler = (context: PageDesignerPreviewContext) => void | Promise<void>
type OptionalWhenDisabled<T> = ({enabled?: true} & T) | ({enabled: false} & Partial<T>)

/**
 * PageDesignerPreview component for managing preview functionality in the page designer
 * 
 * @param enabled - flag to turn on/off Page Designer Preview feature. By default, it is set to true.
 * This flag only applies if page designer is running in a Business Manager iframe.
 * @param getToken - A method that returns the access token for the current user
 * @param onContextChange - Handler for when preview context changes
 */
export const PageDesignerPreview = ({
    children,
    enabled = true,
    getToken,
    onContextChange
}: React.PropsWithChildren<
    // Props are only required when Page Designer Preview is enabled
    OptionalWhenDisabled<{getToken: GetToken; onContextChange?: ContextChangeHandler}>
>) => {
    const history = useHistory()
    const location = useLocation()
    const isHostTrusted = detectPageDesignerPreview()
    const apiClients = useCommerceApi()
    const {siteId} = useConfig()
    const intl = useIntl()
    
    const [previewContext, setPreviewContext] = useState<PageDesignerPreviewContext>({
        effectiveDateTime: null,
        sourceCode: '',
        customerGroupIds: [],
        customQualifiers: {},
        device: 'desktop'
    })

    useEffect(() => {
        if (enabled && isHostTrusted) {
            window.PAGE_DESIGNER_PREVIEW = {
                ...window.PAGE_DESIGNER_PREVIEW,
                getToken,
                onContextChange,
                siteId,
                previewContext,
                setPreviewContext,
                experimentalUnsafeNavigate: (
                    path: string,
                    action: 'push' | 'replace' = 'push'
                ) => {
                    history[action](path)
                }
            }
        }
    }, [enabled, getToken, onContextChange, siteId, previewContext])

    useEffect(() => {
        if (enabled && isHostTrusted) {
            // In Page Designer Preview mode, add cache breaker for all SCAPI's requests.
            // Otherwise, it's possible to get stale responses after the Preview Context is set.
            // (i.e. in this case, we optimize for accurate data, rather than performance/caching)
            const originalGet = (apiClients as any).get
            if (originalGet) {
                (apiClients as any).get = function(...args: any[]) {
                    const [config, ...rest] = args
                    return originalGet.call(this, {
                        ...config,
                        parameters: {
                            ...config?.parameters,
                            c_cache_breaker: Date.now()
                        }
                    }, ...rest)
                }
            }
        }
    }, [apiClients, enabled])

    return (
        <>
            {enabled && isHostTrusted && (
                <Helmet>
                    <script
                        id="page_designer_preview"
                        src={getPageDesignerClientScript()}
                        async
                        type="text/javascript"
                    ></script>
                </Helmet>
            )}
            {children}
        </>
    )
}

PageDesignerPreview.propTypes = {
    children: PropTypes.node,
    enabled: PropTypes.bool,
    // A custom prop type function to only require this prop if enabled is true
    getToken: PropTypes.func,
    onContextChange: PropTypes.func
}

export default PageDesignerPreview 