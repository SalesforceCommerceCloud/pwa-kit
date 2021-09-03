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
                    {intl.formatMessage({defaultMessage: "Sorry, we couldn't find this page"})}
                </title>
            </Helmet>

            <Flex
                h="100%"
                bgColor="gray.50"
                justify="center"
                align="center"
                flexDirection="column"
                px={{base: 5, md: 12}}
                py={20}
            >
                <SearchIcon boxSize={['30px', '32px']} mb={8} />
                <Heading as="h2" fontSize={['xl', '2xl', '2xl', '3xl']} mb={2}>
                    {intl.formatMessage({
                        defaultMessage: "Sorry, we couldn't find this page"
                    })}
                </Heading>
                <Box>
                    <Text textAlign="center">
                        {intl.formatMessage({
                            defaultMessage:
                                'We’ve move a lot of stuff around, and it must’ve gotten lost in the mix. '
                        })}
                    </Text>
                </Box>
                <Box mb={12}>
                    <Text textAlign="center">
                        {intl.formatMessage({
                            defaultMessage:
                                'Please try retyping the address, head back to the previous page or go home.'
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
                            defaultMessage: 'Back to previous page'
                        })}
                    </Button>
                    <Button as={Link} to={'/'}>
                        {intl.formatMessage({
                            defaultMessage: 'Go to home page'
                        })}
                    </Button>
                </Stack>
            </Flex>
        </Box>
    )
}

export default PageNotFound
