/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// TODO: TAOB remove after testing

import React, { useState } from 'react'

import {
    Box,
    Button,
    Center,
    Flex,
    Input,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'

import {useTrustedAgent} from '@salesforce/commerce-sdk-react'

const TrustedAgentBanner = () => {
    const {isAgent, agentId, loginId, login, logout} = useTrustedAgent()
    const [inputValue, setInputValue] = useState(loginId)

    return (
        <Box px={8} py={2} bg="gray.100">
            <Flex>
                <Center>
                    <Text
                        as="h2"
                        color={'black'}
                        fontWeight={700}
                        fontSize={20}
                        pr={8}>
                        Trusted Agent
                    </Text>
                </Center>
                <Center>
                    {agentId && (
                        <>
                            <Text
                                as="div"
                                fontWeight={700}
                                fontSize={16}
                                px={4}>
                                Agent ID
                            </Text>
                            <Text as="div">{agentId}</Text>
                        </>
                    )}
                    {isAgent && loginId && (
                        <>
                            <Text
                                as="div"
                                fontWeight={700}
                                fontSize={16}
                                px={4}>
                                Login ID
                            </Text>
                            <Text as="div">{loginId}</Text>
                        </>
                    )}
                </Center>
                <Box flex={1}/>
                <Center>
                    {!isAgent ? (
                        <form onSubmit={(e) => (e.preventDefault(), login(inputValue))}>
                            <Flex>
                                <Input
                                    mr={4}
                                    bg="white.100"
                                    value={inputValue ? inputValue : ''}
                                    placeholder="Login ID"
                                    onChange={(e) => setInputValue(e.target.value)}
                                />
                                <Button type="submit">Login</Button>
                            </Flex>
                        </form>
                    ) : (
                        <Button onClick={() => logout()}>Logout</Button>
                    )}
                </Center>
            </Flex>
        </Box>
    )
}

export default TrustedAgentBanner
