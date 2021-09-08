/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {
    Box,
    Button,
    Flex,
    Heading,
    IconButton,
    Stack,
    Text,
    useMultiStyleConfig
} from '@chakra-ui/react'

import {createIntl, createIntlCache, RawIntlProvider} from 'react-intl'
import {BrandLogo, FileIcon} from '../icons'
import {useHistory} from 'react-router-dom'
import {DEFAULT_LOCALE} from '../../locale'

// <Error> is rendered when:
//
// 1. A user requests a page that is not routable from `app/routes.jsx`.
// 2. A routed component throws an error in `getProps()`.
// 3. A routed component throws an error in `render()`.
//
// It must not throw an error. Keep it as simple as possible.

const messages = {
    en: {
        logo: 'Logo',
        title: "The page isn't working",
        description:
            'An error has occurred and we’re working to fix the problem. \n' +
            'Try refreshing the page or if you need immediate help please contact support',
        stackTrace: 'Stack Trace',
        contactSupport: 'Contact Support',
        refreshThePage: 'Refresh the page'
    },
    fr: {
        logo: 'Logo',
        title: 'La page ne fonctionne pas',
        description:
            "Une erreur s'est produite et nous travaillons pour résoudre le problème. \n" +
            "Essayez d'actualiser la page ou si vous avez besoin d'une aide immédiate, veuillez contacter le support'",
        stackTrace: 'Stack Trace',
        contactSupport: 'Contactez le support',
        refreshThePage: 'Actualiser la page'
    }
}

// const targetLocale = getTargetLocale([DEFAULT_LOCALE], SUPPORTED_LOCALES, DEFAULT_LOCALE)
// console.log('targetLocale', targetLocale)
const initialLocale = DEFAULT_LOCALE

// This is optional but highly recommended
// since it prevents memory leak
// https://formatjs.io/docs/react-intl/api/#createintl
const cache = createIntlCache()
/**
 * You can use this variable in other files even after reassigning it.
 * As error component has no access to the intl, we need to create one to be able to use formatMessage for translation
 * This mean this component will handle its own translation message
 * */
let intl = createIntl({locale: initialLocale, messages: messages[initialLocale]}, cache)
let formatMessage = intl.formatMessage
const Error = (props) => {
    const {stack, location} = props
    const history = useHistory()
    const styles = useMultiStyleConfig('Error')

    useEffect(() => {
        const isHome = location.pathname === '/'
        const activeLocale = isHome ? DEFAULT_LOCALE : location.pathname.split('/')[1]
        intl = createIntl({locale: activeLocale, messages: messages[activeLocale]}, cache)
        formatMessage = intl.formatMessage
    }, [])

    return (
        <RawIntlProvider value={intl}>
            <Flex id="sf-app" {...styles.container} flexDirection="column">
                <Helmet>
                    <title>{formatMessage({id: 'title'})}</title>
                </Helmet>

                <Box as="header" {...styles.header}>
                    <Box {...styles.headerContent}>
                        <IconButton
                            aria-label={formatMessage({
                                id: 'logo'
                            })}
                            icon={<BrandLogo {...styles.logo} />}
                            {...styles.icons}
                            variant="unstyled"
                            onClick={() => history.push('/')}
                        />
                    </Box>
                </Box>
                <Box
                    as="main"
                    id="app-main"
                    role="main"
                    flex={1}
                    layerStyle="page"
                    {...styles.main}
                >
                    <Flex {...styles.content} flexDirection="column" justify="center">
                        <Stack align="center" mb={20}>
                            <FileIcon boxSize={['30px', '32px']} mb={8} />

                            <Heading as="h2" fontSize={['xl', '2xl', '2xl', '3xl']} mb={2}>
                                {formatMessage({id: 'title'})}
                            </Heading>

                            <Box maxWidth="700px">
                                <Text align="center">{formatMessage({id: 'description'})}</Text>
                            </Box>

                            <Stack direction={['column', 'row']} width={['100%', 'auto']}>
                                <Button variant="outline" bg="white" borderColor={'gray.200'}>
                                    {formatMessage({
                                        id: 'contactSupport'
                                    })}
                                </Button>
                                <Button onClick={() => window.location.reload()}>
                                    {formatMessage({
                                        id: 'refreshThePage'
                                    })}
                                </Button>
                            </Stack>
                        </Stack>
                        <Box>
                            <Text fontWeight="700">
                                {formatMessage({
                                    id: 'stackTrace'
                                })}
                            </Text>
                            {stack && (
                                <Box as="pre" {...styles.pre}>
                                    {stack}
                                </Box>
                            )}
                        </Box>
                    </Flex>
                </Box>
            </Flex>
        </RawIntlProvider>
    )
}

Error.propTypes = {
    // JavaScript error stack trace: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack
    stack: PropTypes.string,
    // HTTP status code: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
    status: PropTypes.number
}

export default Error
