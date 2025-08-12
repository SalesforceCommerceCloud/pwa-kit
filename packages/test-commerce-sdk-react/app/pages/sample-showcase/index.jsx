/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import SampleShowcaseComponent from '../../components/sample-showcase'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'

/**
 * SampleShowcase component
 * @returns {React.JSX.Element}
 */
const SampleShowcase = () => {

    return (
        <Box data-testid="sampleshowcase-page" layerStyle="page">
            <Seo
                title="SampleShowcase"
                description="SampleShowcase Page"
                keywords="Commerce Cloud, Retail React App, React Storefront"
            />

                <SampleShowcaseComponent />
        </Box>
    );
}

export default SampleShowcase;
        