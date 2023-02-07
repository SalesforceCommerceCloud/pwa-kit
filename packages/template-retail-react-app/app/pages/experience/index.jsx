/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Box, Container} from '@chakra-ui/react'
import ImageTile from '../../components/experience/image-tile'
import {getAssetUrl} from 'pwa-kit-react-sdk/ssr/universal/utils'

const Experience = () => {
    return (
        <Box bg="gray.50" py={[8, 16]}>
            <Container
                paddingTop={16}
                width={['100%', '407px']}
                bg="white"
                paddingBottom={14}
                marginTop={8}
                marginBottom={8}
                borderRadius="base"
            >
                <ImageTile
                    imageProps={{
                        alt: 'alt-text',
                        src: {mobile: getAssetUrl('static/img/hero.png')}
                    }}
                />
            </Container>
        </Box>
    )
}

Experience.getTemplateName = () => 'experience'

Experience.propTypes = {}

export default Experience
