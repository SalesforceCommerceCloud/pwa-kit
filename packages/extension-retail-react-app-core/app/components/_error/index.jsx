/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {
    Box,
    Button,
    Flex,
    Heading,
    IconButton,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'

import {BrandLogo, FileIcon} from '@salesforce/retail-react-app/app/components/icons'
import {useHistory} from 'react-router-dom'

// <Error> is rendered when:
//
// 1. A user requests a page that is not routable from `app/routes.jsx`.
// 2. A routed component throws an error in `getProps()`.
// 3. A routed component throws an error in `render()`.
//
// It must not throw an error. Keep it as simple as possible.

const Error = (props) => {
    const {message, stack} = props
    const history = useHistory()

    const title = "This page isn't working"
    return (
        <Flex id="sf-app" flex={1} direction="column" minWidth={'375px'}>
            <Helmet>
                <title>{title}</title>
            </Helmet>
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
                        onClick={() => history.push('/')}
                    />
                </Box>
            </Box>
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
                        <FileIcon boxSize={['30px', '32px']} mb={8} />
                        <Heading as="h2" fontSize={['xl', '2xl', '2xl', '3xl']} mb={2}>
                            {title}
                        </Heading>
                        <Box maxWidth="440px" marginBottom={8}>
                            <Text align="center">
                                An error has occurred. Try refreshing the page or if you need
                                immediate help please contact support.
                            </Text>
                            {message && (
                                <Box
                                    as="pre"
                                    mt={4}
                                    fontSize="sm"
                                    background="gray.50"
                                    borderColor="gray.200"
                                    borderStyle="solid"
                                    borderWidth="1px"
                                    overflow="auto"
                                    padding={4}
                                >
                                    {message}
                                </Box>
                            )}
                        </Box>
                        <Stack direction={['column', 'row']} spacing={4} width={['100%', 'auto']}>
                            <Button
                                variant="outline"
                                bg="white"
                                as="a"
                                borderColor={'gray.200'}
                                target="_blank"
                                href="https://help.salesforce.com/s/support"
                            >
                                Contact Support
                            </Button>
                            <Button onClick={() => window.location.reload()}>
                                Refresh the page
                            </Button>
                        </Stack>
                    </Flex>
                    {stack && (
                        <Box marginTop={20}>
                            <Text fontWeight="bold" fontSize="md">
                                Stack Trace
                            </Text>
                            <Box
                                as="pre"
                                mt={4}
                                fontSize="sm"
                                background="gray.50"
                                borderColor="gray.200"
                                borderStyle="solid"
                                borderWidth="1px"
                                overflow="auto"
                                padding={4}
                            >
                                {stack}
                            </Box>
                        </Box>
                    )}
                </Flex>
            </Box>
        </Flex>
    )
}

Error.propTypes = {
    // JavaScript error stack trace: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack
    stack: PropTypes.string,
    // HTTP status code: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
    status: PropTypes.number,
    // A description of the error, if available
    message: PropTypes.string
}

export default Error
