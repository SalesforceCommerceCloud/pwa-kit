/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {resolveSiteFromUrl} from '../../../utils/site-utils'
import {getTargetLocale} from '../../../utils/locale'

// Components
import {Box, Heading, Skeleton} from '@chakra-ui/react'

// Project Components
import Seo from '../../../components/amplience/seo'

// Amplience Wrapper Component
import AmplienceWrapper from '../../../components/amplience/wrapper'

// Constants
import {MAX_CACHE_AGE} from '../../../constants'
import {useAmpRtv} from '../../../utils/amplience/rtv'
import {AmplienceContextProvider} from '../../../contexts/amplience'
import {AmplienceAPI} from '../../../amplience-api'
import {personalisationChanged} from '../../../amplience-api/utils'

/**
 * This is an example content page for Retail React App.
 * The page is created for demonstration purposes.
 * The page renders SEO metadata and a few promotion
 * categories and products, data is from local file.
 */
const ContentPage = ({page, pageVse}) => {
    const [pageModel, setPageModel] = useState(undefined)
    const [rtvActive, setRtvActive] = useState(false)

    useEffect(() => {
        setPageModel(page)
    }, [page])

    useAmpRtv((model) => {
        // handle form model change
        setPageModel(model.content)
        setRtvActive(true)
    })

    const pageBody = (
        <Box data-testid="amplience-page" layerStyle="page">
            {pageModel == undefined ? (
                <Skeleton height="20px" />
            ) : (
                <>
                    <Seo
                        title={pageModel.seo?.title}
                        description={pageModel.seo?.description}
                        keywords={pageModel.seo?.keywords}
                        noIndex={pageModel.seo?.noindex}
                    />
                    <Heading
                        as="h1"
                        fontSize={{base: '4xl', md: '5xl', lg: '6xl'}}
                        maxWidth={{base: '100%', md: '100%', lg: 'xl'}}
                    >
                        {pageModel.seo?.title}
                    </Heading>
                </>
            )}
            {pageModel == undefined ? (
                <Skeleton height="200px" />
            ) : (
                <>
                    {pageModel.content?.map((item) => {
                        return (
                            <AmplienceWrapper
                                key={item._meta.deliveryId}
                                content={item}
                                rtvActive={rtvActive}
                            />
                        )
                    })}
                </>
            )}
        </Box>
    )

    if (pageVse) {
        return <AmplienceContextProvider vse={pageVse}>{pageBody}</AmplienceContextProvider>
    } else {
        return pageBody
    }
}

ContentPage.getTemplateName = () => 'contentpage'

ContentPage.shouldGetProps = ({previousLocation, location}) =>
    !previousLocation ||
    previousLocation.pathname !== location.pathname ||
    personalisationChanged(true)

ContentPage.getProps = async ({req, res, params, location, api, ampClient}) => {
    const {pageId} = params

    const pageVse = req?.query['pagevse']

    if (res && !ampClient.vse && !pageVse) {
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

    let client
    if (pageVse) {
        client = new AmplienceAPI()
        client.setVse(pageVse)
    } else {
        client = ampClient
    }

    let page

    if (pageId) {
        page = await (
            await client.fetchContent([{key: `page/${pageId}`}], {locale: targetLocale})
        ).pop()
    }

    return {
        page,
        pageVse
    }
}

ContentPage.propTypes = {
    /**
     * The current state of `getProps` when running this value is `true`, otherwise it's
     * `false`. (Provided internally)
     */
    isLoading: PropTypes.bool,
    page: PropTypes.object,
    pageVse: PropTypes.string
}

export default ContentPage
