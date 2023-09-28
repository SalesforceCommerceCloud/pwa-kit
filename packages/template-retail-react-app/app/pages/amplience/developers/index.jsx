/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Heading} from '@chakra-ui/react'

// Components
import {Box} from '@chakra-ui/react'

// Project Components
import Seo from '../../../components/seo'
import Section from '../../../components/section'

// Amplience Wrapper Component
import AmplienceWrapper from '../../../components/amplience/wrapper'

// Constants
import {MAX_CACHE_AGE} from '../../../constants'
import {resolveSiteFromUrl} from '../../../utils/site-utils'
import {getTargetLocale} from '../../../utils/locale'
import {personalisationChanged} from '../../../amplience-api/utils'

const Developers = ({homeSlotTop}) => {
    return (
        <Box data-testid="developers-page" layerStyle="page">
            <Seo
                title="Developers Page"
                description="Commerce Cloud Retail React App"
                keywords="Commerce Cloud, Retail React App, React Storefront"
            />

            <Heading as="h1" fontSize={{base: '4xl', md: '5xl', lg: '6xl'}}>
                Developers Information
            </Heading>

            <AmplienceWrapper fetch={{key: 'section-developers'}}></AmplienceWrapper>

            <Section
                background={'pink.50'}
                marginX="auto"
                paddingY={{base: 4, md: 8}}
                paddingX={{base: 4, md: 8}}
                borderRadius="base"
                width={{base: '100vw', md: 'inherit'}}
                position={{base: 'relative', md: 'inherit'}}
                left={{base: '50%', md: 'inherit'}}
                right={{base: '50%', md: 'inherit'}}
                marginTop="8"
                marginBottom="8"
                marginLeft={{base: '-50vw', md: 'auto'}}
                marginRight={{base: '-50vw', md: 'auto'}}
            >
                <AmplienceWrapper fetch={{key: 'rich-text/dev-by-key1'}}></AmplienceWrapper>
            </Section>

            <AmplienceWrapper fetch={{key: 'home/slot/top-personalised'}}></AmplienceWrapper>

            <Section
                background={'pink.50'}
                marginX="auto"
                paddingY={{base: 4, md: 8}}
                paddingX={{base: 4, md: 8}}
                borderRadius="base"
                width={{base: '100vw', md: 'inherit'}}
                position={{base: 'relative', md: 'inherit'}}
                left={{base: '50%', md: 'inherit'}}
                right={{base: '50%', md: 'inherit'}}
                marginTop="8"
                marginBottom="8"
                marginLeft={{base: '-50vw', md: 'auto'}}
                marginRight={{base: '-50vw', md: 'auto'}}
            >
                <AmplienceWrapper fetch={{key: 'rich-text/dev-by-content'}}></AmplienceWrapper>
            </Section>
            <AmplienceWrapper content={homeSlotTop}></AmplienceWrapper>

            <Section
                background={'pink.50'}
                marginX="auto"
                paddingY={{base: 4, md: 8}}
                paddingX={{base: 4, md: 8}}
                borderRadius="base"
                width={{base: '100vw', md: 'inherit'}}
                position={{base: 'relative', md: 'inherit'}}
                left={{base: '50%', md: 'inherit'}}
                right={{base: '50%', md: 'inherit'}}
                marginTop="8"
                marginBottom="8"
                marginLeft={{base: '-50vw', md: 'auto'}}
                marginRight={{base: '-50vw', md: 'auto'}}
            >
                <AmplienceWrapper fetch={{key: 'rich-text/dev-by-key2'}}></AmplienceWrapper>
            </Section>
            <AmplienceWrapper fetch={{key: 'simple-product-list'}}></AmplienceWrapper>
        </Box>
    )
}

Developers.getTemplateName = () => 'developers'

Developers.shouldGetProps = ({previousLocation, location}) =>
    !previousLocation ||
    previousLocation.pathname !== location.pathname ||
    personalisationChanged(true)

Developers.getProps = async ({res, location, api, ampClient}) => {
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

Developers.propTypes = {
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

export default Developers
