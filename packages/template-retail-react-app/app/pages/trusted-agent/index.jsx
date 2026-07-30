/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Trusted Agent (Order on Behalf) proof of concept page.
//
// This page exercises the `useTrustedAgent` hook end to end: an agent enters a
// shopper login id, a popup opens the Account Manager authorize flow, and once
// the agent authenticates the page shows the resulting agent session state.
// It is intended for verifying the trusted agent login flow on a real
// environment where the popup completes a genuine Account Manager (MFA) login.
//
// Local development note: the popup lands back on the same origin `/callback`
// route and posts the OAuth result to this window. The interactive Account
// Manager login and MFA step only run against a real environment, so the full
// flow is verified after deploying rather than against local mock data.

import React, {useState} from 'react'
import {useTrustedAgent} from '@salesforce/commerce-sdk-react'
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'

const TrustedAgent = () => {
    const {isAgent, agentId, loginId, login, logout} = useTrustedAgent()
    const [inputLoginId, setInputLoginId] = useState('')
    const [status, setStatus] = useState('idle')
    const [error, setError] = useState(null)

    const handleLogin = async () => {
        setError(null)
        setStatus('logging-in')
        try {
            await login(inputLoginId || undefined)
            setStatus('done')
        } catch (e) {
            // The first failure most commonly surfaces here is the API client
            // missing the trusted agent scope, so keep the raw message visible.
            setError(e instanceof Error ? e.message : String(e))
            setStatus('error')
        }
    }

    const handleLogout = async () => {
        setError(null)
        setStatus('logging-out')
        try {
            await logout()
            setStatus('idle')
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e))
            setStatus('error')
        }
    }

    return (
        <Container maxW="container.md" py={8}>
            <Stack spacing={6}>
                <Box>
                    <Heading as="h1" size="lg" data-testid="trusted-agent-page-heading">
                        Trusted Agent on Behalf
                    </Heading>
                    <Text color="gray.600" mt={2}>
                        Log in as an agent on behalf of a shopper to verify the trusted agent flow.
                    </Text>
                </Box>

                <FormControl>
                    <FormLabel htmlFor="trusted-agent-login-id">Shopper login id</FormLabel>
                    <Input
                        id="trusted-agent-login-id"
                        data-testid="trusted-agent-login-id"
                        placeholder="shopper@example.com"
                        value={inputLoginId}
                        onChange={(event) => setInputLoginId(event.target.value)}
                    />
                </FormControl>

                <Stack direction="row" spacing={4}>
                    <Button
                        data-testid="trusted-agent-login-button"
                        onClick={handleLogin}
                        isLoading={status === 'logging-in'}
                    >
                        Log in as agent
                    </Button>
                    <Button
                        variant="outline"
                        data-testid="trusted-agent-logout-button"
                        onClick={handleLogout}
                        isLoading={status === 'logging-out'}
                        isDisabled={!isAgent}
                    >
                        Log out
                    </Button>
                </Stack>

                {error && (
                    <Alert status="error" data-testid="trusted-agent-error">
                        <AlertIcon />
                        <Text as="span" fontFamily="mono">
                            {error}
                        </Text>
                    </Alert>
                )}

                <Box borderWidth="1px" borderRadius="md" p={4}>
                    <Stack spacing={2}>
                        <Text>
                            Agent session:{' '}
                            <Badge
                                colorScheme={isAgent ? 'green' : 'gray'}
                                data-testid="trusted-agent-is-agent"
                            >
                                {isAgent ? 'active' : 'none'}
                            </Badge>
                        </Text>
                        <Text data-testid="trusted-agent-agent-id">
                            Agent id:{' '}
                            <Text as="span" fontFamily="mono">
                                {agentId || '—'}
                            </Text>
                        </Text>
                        <Text data-testid="trusted-agent-login-id-value">
                            Login id:{' '}
                            <Text as="span" fontFamily="mono">
                                {loginId || '—'}
                            </Text>
                        </Text>
                    </Stack>
                </Box>
            </Stack>
        </Container>
    )
}

TrustedAgent.getTemplateName = () => 'trusted-agent'

export default TrustedAgent
