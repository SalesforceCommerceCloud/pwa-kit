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
import {SearchIcon} from '../../components/icons'
import {useHistory} from 'react-router-dom'
import Link from '../../components/link'

const PageNotFound = () => {
    const intl = useIntl()
    const history = useHistory()
    return (
        <Box
            layerStyle="page"
            className="page-not-found"
            height={'100%'}
            padding={{lg: 8, md: 6, sm: 0, base: 0}}
        >
            <Helmet>
                <title>
                    {intl.formatMessage({
                        defaultMessage: "The page you're looking for can't be found.",
                        id: 'page_not_found.title.page_cant_be_found'
                    })}
                </title>
            </Helmet>

            <Flex
                h="100%"
                justify="center"
                align="center"
                flexDirection="column"
                px={{base: 5, md: 12}}
                py={{base: 48, md: 60}}
            >
                <SearchIcon boxSize={['30px', '32px']} mb={8} />
                <Heading as="h2" fontSize={['xl', '2xl', '2xl', '3xl']} mb={2} align="center">
                    {intl.formatMessage({
                        defaultMessage: "The page you're looking for can't be found.",
                        id: 'page_not_found.title.page_cant_be_found'
                    })}
                </Heading>
                <Box mb={12}>
                    <Text textAlign="center">
                        {intl.formatMessage({
                            defaultMessage:
                                'Please try retyping the address, going back to the previous page, or going to the home page.',
                            id: 'page_not_found.message.suggestion_to_try'
                        })}
                    </Text>
                </Box>
                <Stack direction={['column', 'row']} width={['100%', 'auto']}>
                    <Button
                        variant="outline"
                        bg="white"
                        onClick={() => history.goBack()}
                        borderColor={'gray.200'}
                    >
                        {intl.formatMessage({
                            defaultMessage: 'Back to previous page',
                            id: 'page_not_found.action.go_back'
                        })}
                    </Button>
                    <Button as={Link} to={'/'}>
                        {intl.formatMessage({
                            defaultMessage: 'Go to home page',
                            id: 'page_not_found.link.homepage'
                        })}
                    </Button>
                </Stack>
            </Flex>
        </Box>
    )
}

PageNotFound.getProps = async ({res}) => {
    if (res) {
        res.status(404)
    }
}

export default PageNotFound
