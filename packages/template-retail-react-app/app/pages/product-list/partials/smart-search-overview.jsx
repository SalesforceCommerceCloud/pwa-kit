/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useId, useState} from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Button,
    Flex,
    Heading,
    Input,
    Spinner,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {SparkleIcon} from '@salesforce/retail-react-app/app/components/icons'
import AiMarkdown from '@salesforce/retail-react-app/app/components/ai-markdown'
import {
    askAiButton,
    smartSearchColors as colors
} from '@salesforce/retail-react-app/app/components/commerce-agent-search/styles'

const Sparkle = () => (
    <Flex
        aria-hidden="true"
        boxSize={8}
        flexShrink={0}
        borderRadius="full"
        align="center"
        justify="center"
        bg={colors.accent}
        color="white"
    >
        <SparkleIcon boxSize={4} />
    </Flex>
)

const SmartSearchOverview = ({search, query, canOpenAgent}) => {
    const {
        agentRouted,
        handoffError,
        hasOverview,
        streaming,
        data,
        text = '',
        error,
        openAgent
    } = search
    const [expanded, setExpanded] = useState(false)
    const [question, setQuestion] = useState('')
    const overviewId = useId()
    const matches = (data?.hits ?? []).filter(({productName}) => productName).slice(0, 3)
    const names = matches.map(({productName}) => productName)
    const canDiscussResults = canOpenAgent && matches.length > 0

    const ask = (prompt) =>
        openAgent(prompt, {
            resultCount: data.total,
            matches: names.map((name) => name.slice(0, 160)),
            ...(text && !streaming && !error && {overview: text.slice(0, 1600)})
        })

    const overview = text.trim()
    const intro = overview.split(/\r?\n[ \t]*\r?\n/, 1)[0]
    const canExpand = intro !== overview || intro.length > 300
    const clipPreview = !expanded && intro.length > 300
    const shownText = expanded ? overview : intro
    const followUps = [
        ...(names.length > 1
            ? [
                  {
                      label: 'Compare top matches',
                      prompt: `Compare ${names[0]} and ${names[1]} from these results.`
                  }
              ]
            : []),
        {
            label: 'Find the best value',
            prompt: `Which of these "${query}" results are the best value?`
        },
        {label: 'Help me choose', prompt: `Help me choose from these results for "${query}".`}
    ]

    return (
        <Stack spacing={4} mb={{base: 5, md: 7}} color={colors.ink}>
            <Flex
                gap={3}
                align="start"
                bg={colors.tint}
                border="1px solid"
                borderColor={colors.border}
                borderRadius="16px"
                px={{base: 4, md: 5}}
                py={4}
            >
                <Sparkle />
                <Box flex="1" minW={0}>
                    <Flex gap={2} wrap="wrap" align="center">
                        <Heading
                            as="h2"
                            fontSize="sm"
                            textTransform="uppercase"
                            letterSpacing=".09em"
                        >
                            Smart Search
                        </Heading>
                        {hasOverview && (
                            <Text
                                as="span"
                                fontSize="xs"
                                px={2}
                                py={1}
                                bg="whiteAlpha.800"
                                borderRadius="full"
                            >
                                AI overview
                            </Text>
                        )}
                    </Flex>
                    {agentRouted ? (
                        <>
                            <Text mt={2} fontSize="sm" role="status">
                                {handoffError
                                    ? 'The chat couldn’t open. Try opening it again.'
                                    : canOpenAgent
                                    ? 'Continue your question with the shopping assistant.'
                                    : 'The shopping assistant is unavailable.'}
                            </Text>
                            {canOpenAgent && (
                                <Button
                                    mt={3}
                                    size="sm"
                                    {...askAiButton}
                                    onClick={() => openAgent()}
                                >
                                    Open chat →
                                </Button>
                            )}
                        </>
                    ) : hasOverview ? (
                        <>
                            <Box id={overviewId} mt={2} fontSize="sm">
                                {shownText && (
                                    <AiMarkdown
                                        maxH={clipPreview ? '6em' : undefined}
                                        overflow={clipPreview ? 'hidden' : undefined}
                                    >
                                        {shownText}
                                    </AiMarkdown>
                                )}
                                {streaming && (
                                    <Flex
                                        align="center"
                                        gap={2}
                                        mt={shownText ? 2 : 0}
                                        color={colors.muted}
                                        role="status"
                                    >
                                        <Spinner size="xs" aria-hidden="true" />
                                        {shownText
                                            ? 'Writing your overview…'
                                            : 'Preparing your overview…'}
                                    </Flex>
                                )}
                                {!!error && (
                                    <Text role="status" color={colors.muted}>
                                        {error}
                                    </Text>
                                )}
                            </Box>
                            {canExpand && (
                                <Button
                                    size="sm"
                                    variant="link"
                                    color={colors.accent}
                                    mt={2}
                                    aria-expanded={expanded}
                                    aria-controls={overviewId}
                                    onClick={() => setExpanded(!expanded)}
                                >
                                    {expanded ? 'Show less ↑' : 'Read more ↓'}
                                </Button>
                            )}
                        </>
                    ) : (
                        <Text mt={2} fontSize="sm">
                            Browse the matching products below or ask for help choosing.
                        </Text>
                    )}
                </Box>
            </Flex>

            {canDiscussResults && (
                <Box
                    border="1px solid"
                    borderColor={colors.border}
                    borderRadius="16px"
                    overflow="hidden"
                    bg="white"
                >
                    <Flex align="center" gap={3} bg={colors.tint} p={{base: 3, md: 4}}>
                        <Sparkle />
                        <Box minW={0}>
                            <Heading as="h2" fontSize="sm">
                                Ask about these results
                            </Heading>
                            <Text fontSize="sm" color={colors.muted} noOfLines={1}>
                                Continue with the context for “{query}”
                            </Text>
                        </Box>
                    </Flex>
                    <Stack spacing={3} p={{base: 3, md: 4}}>
                        <Flex gap={2} wrap="wrap">
                            {followUps.map(({label, prompt}) => (
                                <Button
                                    key={label}
                                    size="sm"
                                    variant="outline"
                                    borderRadius="full"
                                    borderColor={colors.border}
                                    color={colors.accent}
                                    onClick={() => ask(prompt)}
                                >
                                    {label}
                                </Button>
                            ))}
                        </Flex>
                        <Flex
                            as="form"
                            gap={2}
                            onSubmit={(event) => {
                                event.preventDefault()
                                ask(question.trim() || 'Help me narrow down these search results.')
                                setQuestion('')
                            }}
                        >
                            <Input
                                aria-label="Ask a follow-up about these results"
                                placeholder="Ask a follow-up…"
                                value={question}
                                onChange={(event) => setQuestion(event.target.value)}
                                maxLength={500}
                                bg={colors.canvas}
                                borderColor={colors.border}
                                minW={0}
                            />
                            <Button type="submit" {...askAiButton} flexShrink={0}>
                                Open chat →
                            </Button>
                        </Flex>
                        {handoffError && (
                            <Text role="status" fontSize="sm">
                                The chat couldn’t open. Try again.
                            </Text>
                        )}
                    </Stack>
                </Box>
            )}
        </Stack>
    )
}

SmartSearchOverview.propTypes = {
    search: PropTypes.object.isRequired,
    query: PropTypes.string.isRequired,
    canOpenAgent: PropTypes.bool.isRequired
}

export default SmartSearchOverview
