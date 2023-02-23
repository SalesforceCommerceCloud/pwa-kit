/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {componentMapProxy} from './utils'
import {Page} from '../../components/experience/page'
import {Box} from '@chakra-ui/react'
import SamplePage from './sample-page.json'

const PageViewer = () => {
    return (
        <Box layerStyle={'page'}>
            <Page page={SamplePage} components={componentMapProxy} />
        </Box>
    )
}

PageViewer.displayName = 'PageViewer'

export default PageViewer
