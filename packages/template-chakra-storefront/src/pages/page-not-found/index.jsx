/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Box, Heading, Flex, Button, Stack, Text} from '@chakra-ui/react'
import {Helmet} from 'react-helmet'
import {useIntl} from 'react-intl'
import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import {SearchIcon} from '../../components/icons'
import {useHistory} from 'react-router-dom'
import Link from '../../components/link'

const PageNotFound = () => {
    const intl = useIntl()
    const history = useHistory()
    const {res} = useServerContext()

    const messages = {
        pageTitle: intl.formatMessage({
            id: 'page_not_found.title.page_cant_be_found',
            defaultMessage: "The page you're looking for can't be found."
        }),
        suggestionToTry: intl.formatMessage({
            id: 'page_not_found.message.suggestion_to_try',
            defaultMessage:
                'Please try retyping the address, going back to the previous page, or going to the home page.'
        }),
        goBack: intl.formatMessage({
            id: 'page_not_found.action.go_back',
            defaultMessage: 'Back to previous page'
        }),
        goToHomepage: intl.formatMessage({
            id: 'page_not_found.link.homepage',
            defaultMessage: 'Go to home page'
        })
    }

    if (res) {
        res.status(404)
    }

    return (
        <Box
            layerStyle="page"
            className="page-not-found"
            height="100%"
            padding={{base: 0, sm: 0, md: 6, lg: 8}}
        >
            <Helmet>
                <title>{messages.pageTitle}</title>
            </Helmet>

            <Flex
                h="100%"
                justify="center"
                align="center"
                flexDirection="column"
                px={{base: 5, md: 12}}
                py={{base: 48, md: 60}}
            >
                <SearchIcon boxSize={{base: '30px', md: '32px'}} mb={8} />
                <Heading
                    as="h2"
                    fontSize={{base: 'xl', md: '2xl', lg: '3xl'}}
                    mb={2}
                    textAlign="center"
                >
                    {messages.pageTitle}
                </Heading>
                <Box mb={12}>
                    <Text textAlign="center">{messages.suggestionToTry}</Text>
                </Box>
                <Stack direction={{base: 'column', md: 'row'}} width={{base: '100%', md: 'auto'}}>
                    <Button
                        variant="outline"
                        bg="white"
                        onClick={() => history.goBack()}
                        borderColor="gray.200"
                    >
                        {messages.goBack}
                    </Button>
                    <Button as={Link} to="/">
                        {messages.goToHomepage}
                    </Button>
                </Stack>
            </Flex>
        </Box>
    )
}

export default PageNotFound
