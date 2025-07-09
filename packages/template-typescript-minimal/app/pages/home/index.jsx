/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {useLocation} from 'react-router-dom'

// Components
import {
    Box,
    Button,
    SimpleGrid,
    HStack,
    VStack,
    Text,
    Flex,
    Stack,
    Container,
    Link
} from '@chakra-ui/react'
import {useQuery} from '@tanstack/react-query'
// Others

// Constants
import {useProductSearch} from '@salesforce/commerce-sdk-react'
import HelloJS from '../../components/hello-javascript'

/**
 * This is the home page for Retail React App.
 * The page is created for demonstration purposes.
 * The page renders SEO metadata and a few promotion
 * categories and products, data is from local file.
 */
const Home = () => {
    const {pathname} = useLocation()
    const query = useQuery(
        ['example-data'],
        () =>
            new Promise((resolve) => {
                setTimeout(() => {
                    resolve('This came from react-query')
                }, 1000)
            })
    )

    const {data} = useProductSearch({
        parameters: {
            q: 'shirts',
        }
    })
    console.log('data', data)

    return (
        <Box data-testid="home-page" layerStyle="page">
            {query.data && query.data}
            <HelloJS />
            {data && JSON.stringify(data, null, 2)}
            <SimpleGrid
                columns={{base: 1, md: 1, lg: 3}}
                columnGap={{base: 1, md: 4}}
                rowGap={{base: 4, md: 14}}
            >
                {[0, 1, 2].map((feature, index) => {
                    const featureMessage = feature.message
                    return (
                        <Link key={index} target="_blank" href={feature.href}>
                            <Box
                                bg="white"
                                boxShadow="0px 2px 2px rgba(0, 0, 0, 0.1)"
                                borderRadius="4px"
                                w="full"
                            >
                                <HStack>
                                    <Flex
                                        paddingLeft={6}
                                        height={24}
                                        align="center"
                                        justify="center"
                                    >
                                        Hello
                                    </Flex>
                                    <Text fontWeight="700">Test</Text>
                                </HStack>
                            </Box>
                        </Link>
                    )
                })}
            </SimpleGrid>
        </Box>
    )
}

Home.getTemplateName = () => 'home'

export default Home
