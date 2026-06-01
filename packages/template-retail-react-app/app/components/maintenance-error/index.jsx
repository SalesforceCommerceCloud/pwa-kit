/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {Helmet} from 'react-helmet'
import {
    Box,
    Flex,
    Heading,
    IconButton,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {BrandLogo} from '@salesforce/retail-react-app/app/components/icons'
import {getRouterBasePath} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// <MaintenanceError> is rendered when a 503 is detected via the sfdc_maintenance response header.
// When sharedMaintenancePage is true (default), fetches HTML from cdnUrl and renders it directly.
// Falls back to the built-in message if the fetch fails or sharedMaintenancePage is false.
//
// It must not throw an error. Keep it as simple as possible.

const MaintenanceError = () => {
    const title = 'Site under maintenance'
    const {sharedMaintenancePage} = getConfig()?.app?.pages?.maintenancePage || {}
    // While fetching CDN content, stay in loading state to avoid flashing the fallback
    const [htmlContent, setHtmlContent] = useState(null)
    const [loading, setLoading] = useState(!!sharedMaintenancePage)

    useEffect(() => {
        if (!sharedMaintenancePage) return

        fetch('/api/maintenance-page')
            .then((res) => (res.ok ? res.text() : null))
            .then((html) => {
                if (html) setHtmlContent(html)
            })
            .catch(() => {
                // Proxy fetch failed — fall through to built-in message
            })
            .finally(() => setLoading(false))
    }, [])

    const logoButton = (
        <Box as="header" width="full" boxShadow="base" backgroundColor="white">
            <Box
                maxWidth="container.xxxl"
                marginLeft="auto"
                marginRight="auto"
                px={[4, 4, 6, 8]}
                paddingTop={[1, 1, 2, 4]}
                paddingBottom={[3, 3, 2, 4]}
            >
                <IconButton
                    aria-label="logo"
                    icon={<BrandLogo width={[8, 8, 8, 12]} height={[6, 6, 6, 8]} />}
                    marginBottom={[1, 1, 2, 0]}
                    variant="unstyled"
                    onClick={() => {
                        const basePath = getRouterBasePath()
                        window.location.href = basePath ? `${basePath}/` : '/'
                    }}
                />
            </Box>
        </Box>
    )

    if (loading) return null

    if (htmlContent) {
        return (
            <Flex id="sf-app" flex={1} direction="column" minWidth={'375px'}>
                <Helmet>
                    <title>{title}</title>
                </Helmet>
                {logoButton}
                <Box
                    as="main"
                    id="app-main"
                    role="main"
                    flex={1}
                    dangerouslySetInnerHTML={{__html: htmlContent}}
                />
            </Flex>
        )
    }

    return (
        <Flex id="sf-app" flex={1} direction="column" minWidth={'375px'}>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            {logoButton}
            <Box
                as="main"
                id="app-main"
                role="main"
                layerStyle="page"
                padding={{lg: 8, md: 6, sm: 0, base: 0}}
                flex={1}
            >
                <Flex
                    direction={'column'}
                    justify="center"
                    px={{base: 4, md: 6, lg: 50}}
                    py={{base: 20, md: 24}}
                >
                    <Flex align="center" direction="column">
                        <Heading as="h2" fontSize={['xl', '2xl', '2xl', '3xl']} mb={4}>
                            {title}
                        </Heading>
                        <Box maxWidth="440px">
                            <Text align="center">
                                We&apos;re currently performing scheduled maintenance. We&apos;ll be
                                back shortly. Thank you for your patience.
                            </Text>
                        </Box>
                    </Flex>
                </Flex>
            </Box>
        </Flex>
    )
}

export default MaintenanceError
