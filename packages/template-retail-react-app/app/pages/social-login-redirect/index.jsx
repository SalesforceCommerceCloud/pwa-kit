/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {FormattedMessage} from 'react-intl'
import {Box, Container, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {BrandLogo} from '@salesforce/retail-react-app/app/components/icons'

const SocialLoginRedirect = () => {
    return (
        <Box data-testid="login-redirect-page" bg="gray.50" py={[8, 16]}>
            <Container
                paddingTop={16}
                width={['100%', '407px']}
                bg="white"
                paddingBottom={14}
                marginTop={8}
                marginBottom={8}
                borderRadius="base"
            >
                <Stack justify="center" align="center" spacing={8} marginBottom={8}>
                    <BrandLogo width="60px" height="auto" />
                    <Text align="center" fontSize="xl" fontWeight="semibold">
                        <FormattedMessage defaultMessage="Authenticating..." />
                    </Text>
                    <Text align="center" fontSize="m">
                        <FormattedMessage
                            defaultMessage="If you are not automatically redirected, click <link>this link</link> to proceed."
                            values={{
                                link: (chunks) => (
                                    <a
                                        href="/account"
                                        style={{color: '#0176D3', textDecoration: 'underline'}}
                                    >
                                        {chunks}
                                    </a>
                                )
                            }}
                        />
                    </Text>
                </Stack>
            </Container>
        </Box>
    )
}

SocialLoginRedirect.getTemplateName = () => 'social-login-redirect'

export default SocialLoginRedirect
