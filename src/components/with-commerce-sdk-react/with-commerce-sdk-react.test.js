/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {render, screen} from '@testing-library/react'

import {withCommerceSdkReact} from '../../components/with-commerce-sdk-react'

// Simple mock component that renders the data provided to it from the HoC as a script.
const MockedComponent = ({data}) => {
    return (
        <script data-testid="enhanced-component" type="application/json">
            {JSON.stringify(data)}
        </script>
    )
}

MockedComponent.propTypes = {
    data: PropTypes.object
}

describe('withCommerceSdkReact enhanced component', function () {
    // TODO: This entire file needs to be re-written.
    test.skip('renders placeholder when hook is loading', async () => {
        const EnhancedComponent = withCommerceSdkReact(MockedComponent)

        render(<EnhancedComponent />)

        // Placeholder is rendered.
        expect(screen.getByTestId('placeholder')).toBeDefined()
    })
})
