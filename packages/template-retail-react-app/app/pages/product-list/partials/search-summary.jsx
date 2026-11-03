/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    Box,
    Button,
    Flex,
    Heading,
    HStack,
    Image,
    Input,
    SimpleGrid,
    Spinner,
    Text,
    Wrap
} from '@salesforce/retail-react-app/app/components/shared/ui'
import Link from '@salesforce/retail-react-app/app/components/link'
import AiMarkdown from '@salesforce/retail-react-app/app/components/ai-markdown'
import {SparkleIcon} from '@salesforce/retail-react-app/app/components/icons'
import {useShopperAgent} from '@salesforce/retail-react-app/app/hooks/use-shopper-agent'

import {useSearchAssistantSession} from '@salesforce/retail-react-app/app/contexts/search-assistant-session'

const DEFAULT_CONFIG = {followUps: true, agentHandoff: false, title: 'Your AI shopping guide'}

const Picks = ({products = [], currency = 'USD', compact = false}) => {
    const {locale} = useIntl()
    return (
        <SimpleGrid
            columns={{base: 1, md: Math.min(3, products.length || 1)}}
            spacing={3}
            mt={4}
            data-testid="search-ai-picks"
        >
            {products.slice(0, 3).map((product, index) => {
                const raw = String(product.price ?? '')
                const value = Number(raw.replace(/^from\s+/i, ''))
                const price =
                    product.price != null && Number.isFinite(value)
                        ? `${/^from/i.test(raw) ? 'From ' : ''}${new Intl.NumberFormat(locale, {
                              style: 'currency',
                              currency
                          }).format(value)}`
                        : 'See product details'
                return (
                    <Link
                        key={product.id}
                        href={`/product/${encodeURIComponent(product.id)}`}
                        display="flex"
                        alignItems="center"
                        gap={3}
                        p={3}
                        bg="white"
                        border="1px solid #e0e6dc"
                        borderRadius="12px"
                        textDecoration="none"
                        _hover={{
                            textDecoration: 'none',
                            borderColor: '#7f9b74',
                            boxShadow: '0 4px 12px #233d2410'
                        }}
                        _focusVisible={{outline: '2px solid #446a3c', outlineOffset: 2}}
                        data-testid={`ai-pick-${product.id}`}
                    >
                        {product.image && (
                            <Image
                                src={product.image}
                                alt={product.name}
                                w={compact ? '48px' : '66px'}
                                h={compact ? '58px' : '80px'}
                                objectFit="contain"
                                flexShrink={0}
                                borderRadius="8px"
                            />
                        )}
                        <Box minW={0}>
                            <Text
                                fontSize="10px"
                                fontWeight="700"
                                letterSpacing=".12em"
                                color="#607255"
                                mb={1}
                            >
                                {index === 0 ? 'TOP MATCH' : 'ALSO WORTH A LOOK'}
                            </Text>
                            <Text fontWeight="600" fontSize="sm" color="#233126" noOfLines={2}>
                                {product.name}
                            </Text>
                            <Text fontSize="sm" color="#455342" mt={1}>
                                {price}{' '}
                                <Box as="span" color="#7a8875" ml={1}>
                                    ↗
                                </Box>
                            </Text>
                        </Box>
                    </Link>
                )
            })}
        </SimpleGrid>
    )
}
Picks.propTypes = {products: PropTypes.array, currency: PropTypes.string, compact: PropTypes.bool}

const SearchSummary = ({
    config = DEFAULT_CONFIG,
    text,
    isStreaming,
    error,
    picks = [],
    total = 0,
    query,
    currency,
    contextId,
    followUps = [],
    suggestions = [],
    onFollowUp,
    refinedFrom
}) => {
    const shared = useSearchAssistantSession()
    const [question, setQuestion] = useState('')
    const {actions: agent} = useShopperAgent()
    const busy = isStreaming || followUps.some((turn) => turn.busy)
    const ask = (value) => {
        if (!value.trim() || busy || !contextId) return
        onFollowUp?.(value)
        setQuestion('')
    }
    return (
        <Box
            border="1px solid #dce5d5"
            borderRadius="18px"
            bg="#f6f8f2"
            mb={8}
            overflow="hidden"
            data-testid="search-ai-overview"
        >
            <Box p={{base: 5, md: 7}}>
                <Flex justify="space-between" align="center" gap={4} wrap="wrap" mb={4}>
                    <HStack spacing={3}>
                        <Flex
                            align="center"
                            justify="center"
                            bg="#243f27"
                            color="white"
                            w="34px"
                            h="34px"
                            borderRadius="10px"
                        >
                            <SparkleIcon boxSize={5} />
                        </Flex>
                        <Box>
                            <Heading as="h2" size="md" fontWeight="600" color="#223924">
                                {config.title}
                            </Heading>
                            <Text fontSize="xs" color="#6c7965" mt={1}>
                                {total} catalog {total === 1 ? 'match' : 'matches'} · A few good
                                places to start
                            </Text>
                        </Box>
                    </HStack>
                    {isStreaming && (
                        <HStack color="#65785b">
                            <Spinner size="xs" />
                            <Text fontSize="xs">Putting it together…</Text>
                        </HStack>
                    )}
                </Flex>
                {refinedFrom && (
                    <Text fontSize="xs" color="#64775b" mb={3}>
                        New search from your question: “{refinedFrom}”
                    </Text>
                )}
                <AiMarkdown
                    fontSize={{base: 'sm', md: 'md'}}
                    lineHeight="1.8"
                    color="#35402f"
                    whiteSpace="normal"
                    data-testid="search-ai-overview-text"
                >
                    {text ||
                        (isStreaming
                            ? 'Your results are ready. Finding a few highlights for you…'
                            : !total
                            ? 'No matches this time. Try a broader keyword, or let the Commerce Agent help you find something.'
                            : '')}
                </AiMarkdown>
                {error && (
                    <Text role="status" color="#846b38" fontSize="sm" mt={3}>
                        {error}
                    </Text>
                )}
                <Picks products={picks} currency={currency} />
                <Text fontSize="xs" color="#7b8772" mt={3}>
                    A few highlights from your search. Browse all matching products below.
                </Text>
            </Box>
            {(config.followUps || config.agentHandoff) && (
                <Box borderTop="1px solid #e0e6d9" bg="white" px={{base: 5, md: 7}} pt={5} pb={6}>
                    <Flex justify="space-between" gap={3} align="center" wrap="wrap" mb={4}>
                        {config.followUps && (
                            <Box>
                                <Text fontWeight="600" fontSize="sm" color="#2b3d29">
                                    Let’s narrow it down.
                                </Text>
                                <Text fontSize="xs" color="#7a8474" mt={1}>
                                    Ask about “{query}” — I’ll use the catalog details or start a
                                    new search.
                                </Text>
                            </Box>
                        )}
                        {config.agentHandoff && (
                            <Button
                                size="sm"
                                variant="outline"
                                borderColor="#cdd8c5"
                                color="#365032"
                                borderRadius="full"
                                leftIcon={<SparkleIcon boxSize={3} />}
                                onClick={agent.open}
                                isDisabled={busy || shared?.handoffState.busy}
                                isLoading={shared?.handoffState.busy}
                                loadingText="Opening agent"
                            >
                                Go full agent mode ↗
                            </Button>
                        )}
                    </Flex>
                    {shared?.handoffState.error && (
                        <Text role="alert" fontSize="sm" color="#8a6037" mb={3}>
                            {shared.handoffState.error}
                        </Text>
                    )}
                    {config.followUps && (
                        <>
                            <Wrap spacing={2} mb={4}>
                                {suggestions.map(({id, question: chip}) => (
                                    <Button
                                        key={id}
                                        size="sm"
                                        variant="outline"
                                        fontWeight="400"
                                        borderColor="#e0e5dc"
                                        borderRadius="full"
                                        whiteSpace="normal"
                                        height="auto"
                                        py={2}
                                        textAlign="left"
                                        color="#53634b"
                                        bg="#fcfdfb"
                                        _hover={{bg: '#edf2e8', borderColor: '#9fb593'}}
                                        onClick={() => ask(chip)}
                                        isDisabled={busy || !contextId || !total}
                                    >
                                        {chip}
                                    </Button>
                                ))}
                            </Wrap>
                            {!!followUps.length && (
                                <Box
                                    maxH="470px"
                                    overflowY="auto"
                                    mb={4}
                                    data-testid="search-follow-up-conversation"
                                >
                                    {followUps.map((turn) => (
                                        <Box
                                            key={turn.id}
                                            py={4}
                                            borderTop="1px solid #edf0e8"
                                            data-testid="search-follow-up-turn"
                                        >
                                            <Flex justify="flex-end" mb={3}>
                                                <Text
                                                    bg="#edf2e7"
                                                    color="#354c2e"
                                                    borderRadius="14px 14px 2px 14px"
                                                    py={2}
                                                    px={4}
                                                    fontSize="sm"
                                                    maxW="90%"
                                                >
                                                    {turn.question}
                                                </Text>
                                            </Flex>
                                            <AiMarkdown
                                                whiteSpace="normal"
                                                lineHeight="1.8"
                                                color="#35402f"
                                                fontSize="sm"
                                                data-testid="search-follow-up-answer"
                                            >
                                                {turn.text}
                                            </AiMarkdown>
                                            {turn.busy && (
                                                <HStack mt={2} color="#7a876d">
                                                    <Spinner size="xs" />
                                                    <Text role="status" fontSize="xs">
                                                        {turn.status}
                                                    </Text>
                                                </HStack>
                                            )}
                                            {turn.error && (
                                                <Text
                                                    role="alert"
                                                    color="#8a6037"
                                                    fontSize="sm"
                                                    mt={2}
                                                >
                                                    {turn.error}
                                                </Text>
                                            )}
                                            {turn.coverage && !turn.busy && (
                                                <Text fontSize="xs" color="#7b8871" mt={2}>
                                                    {turn.coverage.complete
                                                        ? `Using ${turn.coverage.loaded} matches from your search`
                                                        : `Using the first ${turn.coverage.loaded} of ${turn.coverage.total} matches`}
                                                </Text>
                                            )}
                                            <Picks
                                                products={turn.picks}
                                                currency={currency}
                                                compact
                                            />
                                        </Box>
                                    ))}
                                </Box>
                            )}
                            <Flex
                                as="form"
                                align="center"
                                border="1px solid #d7dfd0"
                                borderRadius="12px"
                                p={1.5}
                                bg="#fbfcf9"
                                gap={2}
                                onSubmit={(event) => {
                                    event.preventDefault()
                                    ask(question)
                                }}
                            >
                                <Input
                                    aria-label="Ask a follow-up about these results"
                                    placeholder="Ask a question about these products…"
                                    value={question}
                                    onChange={(event) => setQuestion(event.target.value)}
                                    maxLength={1200}
                                    isDisabled={busy || !contextId || !total}
                                    border="none"
                                    fontSize="sm"
                                    _focusVisible={{boxShadow: 'none'}}
                                    _placeholder={{color: '#87917d'}}
                                />
                                <Button
                                    type="submit"
                                    bg="#243f27"
                                    color="white"
                                    borderRadius="9px"
                                    fontSize="sm"
                                    _hover={{bg: '#365839'}}
                                    isDisabled={busy || !contextId || !question.trim() || !total}
                                    isLoading={followUps.some((turn) => turn.busy)}
                                    loadingText="Checking"
                                    _disabled={{bg: '#e1e8da', color: '#839477', opacity: 1}}
                                >
                                    Ask ↗
                                </Button>
                            </Flex>
                        </>
                    )}
                </Box>
            )}
        </Box>
    )
}
SearchSummary.propTypes = {
    config: PropTypes.object,
    text: PropTypes.string,
    isStreaming: PropTypes.bool,
    error: PropTypes.string,
    picks: PropTypes.array,
    total: PropTypes.number,
    query: PropTypes.string,
    currency: PropTypes.string,
    contextId: PropTypes.string,
    followUps: PropTypes.array,
    suggestions: PropTypes.array,
    onFollowUp: PropTypes.func,
    refinedFrom: PropTypes.string
}
export default SearchSummary
