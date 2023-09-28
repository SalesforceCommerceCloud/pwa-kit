/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {useLocation} from 'react-router-dom'

// Components
import {Box} from '@chakra-ui/react'

// Project Components
import Seo from '../../components/seo'

// Amplience Wrapper Component
import AmplienceWrapper from '../../components/amplience/wrapper'

//Hooks
import useEinstein from '../../commerce-api/hooks/useEinstein'

// Constants
import {MAX_CACHE_AGE} from '../../constants'
import {resolveSiteFromUrl} from '../../utils/site-utils'
import {getTargetLocale} from '../../utils/locale'
import {personalisationChanged} from '../../amplience-api/utils'

/**
 * This is the home page for Retail React App.
 * The page is created for demonstration purposes.
 * The page renders SEO metadata and a few promotion
 * categories and products, data is from local file.
 */
const Home = ({homeSlotTop}) => {
    const einstein = useEinstein()
    const {pathname} = useLocation()

    /**************** Einstein ****************/
    useEffect(() => {
        einstein.sendViewPage(pathname)
    }, [])

    return (
        <Box data-testid="home-page" layerStyle="page">
            <Seo
                title="Home Page"
                description="Commerce Cloud Retail React App"
                keywords="Commerce Cloud, Retail React App, React Storefront"
            />

            <AmplienceWrapper fetch={{key: 'home/slot/top-personalised'}}></AmplienceWrapper>
            <AmplienceWrapper fetch={{key: 'home/hero-features'}}></AmplienceWrapper>
            <AmplienceWrapper content={homeSlotTop}></AmplienceWrapper>
            <AmplienceWrapper fetch={{key: 'shoppable/woman-fall'}}></AmplienceWrapper>
            <AmplienceWrapper fetch={{key: 'simple-product-list'}}></AmplienceWrapper>
            <AmplienceWrapper fetch={{key: 'section'}}></AmplienceWrapper>
            <AmplienceWrapper fetch={{key: 'home/features'}}></AmplienceWrapper>
            <AmplienceWrapper fetch={{key: 'section/we-are-here'}}></AmplienceWrapper>
        </Box>
    )
}

Home.getTemplateName = () => 'home'

Home.shouldGetProps = ({previousLocation, location}) =>
    !previousLocation ||
    previousLocation.pathname !== location.pathname ||
    personalisationChanged(true)

Home.getProps = async ({res, location, api, ampClient}) => {
    if (res && !ampClient.vse) {
        res.set('Cache-Control', `max-age=${MAX_CACHE_AGE}`)
    }

    const site = resolveSiteFromUrl(location.pathname)
    const l10nConfig = site.l10n
    const targetLocale = getTargetLocale({
        getUserPreferredLocales: () => {
            const {locale} = api.getConfig()
            return [locale]
        },
        l10nConfig
    })

    const homeSlotTop = await (
        await ampClient.fetchContent([{key: 'home/slot/top'}], {locale: targetLocale})
    ).pop()

    return {homeSlotTop}
}

Home.propTypes = {
    /**
     * Home slot data requested from Amplience.
     */
    homeSlotTop: PropTypes.object,
    /**
     * The current state of `getProps` when running this value is `true`, otherwise it's
     * `false`. (Provided internally)
     */
    isLoading: PropTypes.bool
}

export default Home
