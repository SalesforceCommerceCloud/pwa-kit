/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {useIntl, FormattedMessage} from 'react-intl'
import {useLocation} from 'react-router-dom'
import {usePage} from '@salesforce/commerce-sdk-react'
import {Page} from '@salesforce/commerce-sdk-react/page-designer'

// Components
import {Box, Heading} from '@salesforce/retail-react-app/app/components/shared/ui'

// Page Designer Components
import {PAGEDESIGNER_TO_COMPONENT} from '@salesforce/retail-react-app/app/page-designer/component-map'

// Project Components
import Seo from '@salesforce/retail-react-app/app/components/seo'

//Hooks
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import useDataCloud from '@salesforce/retail-react-app/app/hooks/use-datacloud'

// Constants
import {MAX_CACHE_AGE, STALE_WHILE_REVALIDATE} from '@salesforce/retail-react-app/app/constants'
import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'

const HOME_PAGE_ID = 'homepage'

/**
 * This is the home page for Retail React App using Page Designer.
 * The page content is managed through Business Manager's Page Designer,
 * allowing merchandisers to update content without code changes.
 */
const Home = () => {
    const intl = useIntl()
    const einstein = useEinstein()
    const dataCloud = useDataCloud()
    const {pathname} = useLocation()

    const {res} = useServerContext()
    if (res) {
        res.set(
            'Cache-Control',
            `s-maxage=${MAX_CACHE_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`
        )
    }

    // Fetch the Page Designer page content
    const {
        data: pageData,
        isLoading,
        error
    } = usePage({
        parameters: {pageId: HOME_PAGE_ID}
    })

    /**************** Einstein ****************/
    useEffect(() => {
        einstein.sendViewPage(pathname)
        dataCloud.sendViewPage(pathname)
    }, [])

    return (
        <Box data-testid="home-page" layerStyle="page">
            <Heading as="h1" srOnly>
                <FormattedMessage defaultMessage="Home" id="home.title.home" />
            </Heading>
            <Seo
                title="Home Page"
                description="Commerce Cloud Retail React App"
                keywords="Commerce Cloud, Retail React App, React Storefront"
            />
            {isLoading && (
                <Box textAlign="center" py={8}>
                    Loading...
                </Box>
            )}

            {error && (
                <Box textAlign="center" py={8} color="red.500">
                    Error loading page content. Please check that the homepage is configured in
                    Business Manager Page Designer.
                </Box>
            )}

            {pageData && !error && <Page page={pageData} components={PAGEDESIGNER_TO_COMPONENT} />}
        </Box>
    )
}

Home.getTemplateName = () => 'home'

export default Home