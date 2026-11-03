/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {useLocation} from 'react-router-dom'
import {
    Box,
    Button,
    Flex,
    Heading,
    HStack,
    Input,
    Text,
    Wrap
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {SearchIcon, SparkleIcon} from '@salesforce/retail-react-app/app/components/icons'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useShopperAgent} from '@salesforce/retail-react-app/app/hooks/use-shopper-agent'

import {
    useSearchSummaryConfig,
    useCommerceAgentConfig
} from '@salesforce/retail-react-app/app/hooks/use-storefront-config'

const AiSearch = ({hero = false}) => {
    const settings = useSearchSummaryConfig()
    const heroSettings = settings.homeHero
    const commerceAgent = useCommerceAgentConfig()
    const canOpenAgent =
        settings.agentHandoff &&
        commerceAgent.enabled === 'true' &&
        commerceAgent.provider === 'commerce-client'
    const location = useLocation()
    const query = new URLSearchParams(location.search).get('q') || ''
    const [value, setValue] = useState(query)
    const navigate = useNavigation()
    const {actions: agent} = useShopperAgent()
    useEffect(() => setValue(query), [query, location.pathname])
    const search = (text) => {
        const cleaned = text.trim()
        if (cleaned) navigate(`/search?q=${encodeURIComponent(cleaned)}`)
    }
    const form = (
        <Flex
            as="form"
            role="search"
            aria-label={hero ? 'Discover products' : 'Search the catalog'}
            onSubmit={(event) => {
                event.preventDefault()
                search(value)
            }}
            align="center"
            gap={2}
            bg="white"
            border="1px solid"
            borderColor="#d7dfd5"
            borderRadius="14px"
            p={{base: 1.5, md: 2}}
            boxShadow={hero ? '0 12px 36px rgba(0,0,0,.16)' : '0 2px 5px rgba(20,40,20,.04)'}
            w="full"
            data-testid={hero ? 'ai-search-hero' : 'ai-search-compact'}
        >
            <SearchIcon color="#72816f" boxSize={5} ml={2} flexShrink={0} />
            <Input
                type="search"
                color="#233d24"
                bg="#fff"
                aria-label={hero ? 'AI product search' : 'Search or ask AI'}
                placeholder={hero ? 'What are you looking for?' : settings.searchPlaceholder}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                maxLength={2000}
                border="none"
                focusBorderColor="transparent"
                _focusVisible={{boxShadow: 'none'}}
                _placeholder={{color: '#7c887a'}}
                fontSize={{base: 'sm', md: 'md'}}
                h={hero ? '48px' : '38px'}
                px={1}
                minW={0}
            />
            <Button
                type="submit"
                leftIcon={<SparkleIcon boxSize={4} />}
                bg="#233d24"
                color="white"
                _hover={{bg: '#365638'}}
                _active={{bg: '#1b301c'}}
                _disabled={{bg: '#dce4d6', color: '#778572', cursor: 'not-allowed', opacity: 1}}
                _focusVisible={{boxShadow: '0 0 0 3px #a4b69b'}}
                borderRadius="10px"
                h={hero ? '44px' : '36px'}
                px={{base: 3, md: 5}}
                flexShrink={0}
                fontSize="sm"
                isDisabled={!value.trim()}
            >
                Find with AI
            </Button>
        </Flex>
    )
    if (!hero)
        return (
            <Box w="full" maxW="760px" mx="auto">
                {form}
            </Box>
        )
    return (
        <Box
            as="section"
            position="relative"
            overflow="hidden"
            borderRadius={{base: 0, md: '18px'}}
            bg="#152b1b"
            backgroundImage={
                heroSettings.imageUrl
                    ? `linear-gradient(90deg, rgba(8,28,16,.82), rgba(8,28,16,.46)), url("${heroSettings.imageUrl}")`
                    : undefined
            }
            backgroundSize="cover"
            backgroundPosition="center"
            color="white"
            py={{base: 12, md: 20}}
            px={{base: 5, md: 12}}
            mb={10}
            textAlign="center"
        >
            <Box maxW="820px" mx="auto">
                <HStack justify="center" spacing={2} mb={5} color="#d6e3cb">
                    <SparkleIcon boxSize={4} />
                    <Text fontSize="xs" letterSpacing=".2em" fontWeight="600">
                        {heroSettings.eyebrow}
                    </Text>
                </HStack>
                <Heading
                    as="h2"
                    fontFamily="Georgia, serif"
                    fontSize={{base: '38px', md: '64px'}}
                    fontWeight="500"
                    lineHeight="1.08"
                    letterSpacing="-.035em"
                    mb={5}
                >
                    {heroSettings.title}
                </Heading>
                <Text color="#e2e9df" mb={8} fontSize={{base: 'sm', md: 'md'}}>
                    {heroSettings.description}
                </Text>
                {form}
                <Wrap justify="center" mt={4} spacing={2}>
                    {heroSettings.suggestedSearches.map(({label, query: keyword}) => (
                        <Button
                            key={keyword}
                            size="sm"
                            variant="outline"
                            borderColor="whiteAlpha.500"
                            color="white"
                            bg="whiteAlpha.100"
                            borderRadius="full"
                            fontWeight="400"
                            _hover={{bg: 'whiteAlpha.300'}}
                            onClick={() => search(keyword)}
                        >
                            {label}
                        </Button>
                    ))}
                    {canOpenAgent && (
                        <Button
                            size="sm"
                            variant="outline"
                            borderColor="whiteAlpha.500"
                            color="white"
                            bg="whiteAlpha.100"
                            borderRadius="full"
                            fontWeight="400"
                            _hover={{bg: 'whiteAlpha.300'}}
                            onClick={agent.open}
                        >
                            Help me choose ↗
                        </Button>
                    )}
                </Wrap>
            </Box>
        </Box>
    )
}
AiSearch.propTypes = {hero: PropTypes.bool}
export default AiSearch
