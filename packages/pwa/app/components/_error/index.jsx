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
    Text,
    useMultiStyleConfig
} from '@chakra-ui/react'

import {BrandLogo, FileIcon} from '../icons'
import {useHistory} from 'react-router-dom'

// <Error> is rendered when:
//
// 1. A user requests a page that is not routable from `app/routes.jsx`.
// 2. A routed component throws an error in `getProps()`.
// 3. A routed component throws an error in `render()`.
//
// It must not throw an error. Keep it as simple as possible.

const Error = (props) => {
    const {stack} = props
    const history = useHistory()
    const styles = useMultiStyleConfig('Error')

    const title = "This page isn't working"
    return (
        <Flex id="sf-app" {...styles.container} flexDirection="column">
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <Box as="header" {...styles.header}>
                <Box {...styles.headerContent}>
                    <IconButton
                        aria-label="logo"
                        icon={<BrandLogo {...styles.logo} />}
                        {...styles.icons}
                        variant="unstyled"
                        onClick={() => history.push('/')}
                    />
                </Box>
            </Box>
            <Box as="main" id="app-main" role="main" layerStyle="page" {...styles.main}>
                <Flex {...styles.content}>
                    <Flex align="center" direction="column">
                        <FileIcon boxSize={['30px', '32px']} mb={8} />
                        <Heading as="h2" fontSize={['xl', '2xl', '2xl', '3xl']} mb={2}>
                            {title}
                        </Heading>
                        <Box {...styles.description}>
                            <Text align="center">
                                An error has occurred. Try refreshing the page or if you need
                                immediate help please contact support.
                            </Text>
                        </Box>
                        <Stack direction={['column', 'row']} spacing={4} {...styles.buttons}>
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
                    <Box {...styles.stackTrace}>
                        <Text fontWeight="bold" fontSize="md">
                            Stack Trace
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
    )
}

Error.propTypes = {
    // JavaScript error stack trace: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack
    stack: PropTypes.string,
    // HTTP status code: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
    status: PropTypes.number
}

export default Error
