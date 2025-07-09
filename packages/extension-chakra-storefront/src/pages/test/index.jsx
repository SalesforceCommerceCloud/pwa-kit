/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import {useQuery} from '@tanstack/react-query'


// Chakra
import {
    Box,
    useDisclosure,
    useSlotRecipe
} from '@chakra-ui/react'

/**
 * This is the home page for Retail React App.
 * The page is created for demonstration purposes.
 * The page renders SEO metadata and a few promotion
 * categories and products, data is from local file.
 */
const Test = () => {
    // Apply styles from the theme

    // NOTE: useDisclosure breaks ssr. Uncomment to see the issue.
    // const {open, onOpen, onClose} = useDisclosure()
    // Apply styles from the theme
    const recipe = useSlotRecipe({key: 'app'})
    const styles = recipe()

    const {data} = useQuery({
        queryKey: ['test-page'],
        queryFn: () => {
            return Promise.resolve(new Date().toISOString())
        }
    })


    // console.log('data: ', data)
    return <Box css={styles.container}>Test Page <br />Server Time: {data}</Box>
}

Test.getTemplateName = () => 'Test'

export default Test
