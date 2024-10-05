/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, { useState } from 'react'

import {
    Box,
    Button,
    Center,
    Flex,
    Input,
    Text,
} from '@salesforce/retail-react-app/app/components/shared/ui'

import {useTrustedAgent} from '@salesforce/commerce-sdk-react'

const TrustedAgentBanner = () => {
    const {isAgent, agentId, loginId, login, logout} = useTrustedAgent()
    const [loginIdValue, setLoginId] = useState(loginId)

    return (
        <Box px={8} py={2} bg="gray.100">
            <Flex>
                <Center>
                    <Text
                        as="h2"
                        color={'black'}
                        fontWeight={700}
                        fontSize={20}>
                        Trusted Agent
                    </Text>
                </Center>
                <Center>
                    {agentId && (
                        <>
                            <Box>
                                <Text
                                    fontWeight={700}
                                    fontSize={16}
                                    px={4}>
                                    Agent ID
                                </Text>
                            </Box>
                            <Box><Text>{agentId}</Text></Box>
                        </>
                    )}
                    {loginId && (
                        <>
                            <Box>
                                <Text
                                    fontWeight={700}
                                    fontSize={16}
                                    px={4}>
                                    Login ID
                                </Text>
                            </Box>
                            <Box><Text>{loginId}</Text></Box>
                        </>
                    )}
                </Center>
                <Box flex={1}/>
                <Center>
                    {isAgent ? (
                        <Button onClick={() => logout()}>Logout</Button>
                    ) : (
                        <>
                            <Input
                                mr={4}
                                bg="white.100"
                                value={loginIdValue && loginIdValue !== 'Guest' ? loginIdValue : ''}
                                placeholder="Login ID"
                                onChange={e => setLoginId(e.target.value)}
                            />
                            <Button onClick={() => login(loginIdValue)}>Login</Button>
                        </>
                    )}
                </Center>
            </Flex>
        </Box>
    )
}

export default TrustedAgentBanner
