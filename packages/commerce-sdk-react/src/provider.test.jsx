/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import useCommerceApi from './hooks/useCommerceApi'
import CommerceApiProvider from './provider'
// import {shallow} from 'enzyme'
import {render, screen} from '@testing-library/react'

// TODO: Import this in the setup-jest file instead
import '@testing-library/jest-dom'

const BAR = () => {
    const api = useCommerceApi()

    return (
        <div>
            {api?.shopperSearch && <span id="shopperSearch">shopperSearch client exists</span>}
        </div>
    )
}

const App = () => {
    return (
        <CommerceApiProvider
            proxy="http://localhost:3000/mobify/proxy/api"
            clientId="c9c45bfd-0ed3-4aa2-9971-40f88962b836"
            organizationId="f_ecom_zzrf_001"
            shortCode="8o7m175y"
            siteId="RefArchGlobal"
            locale="en_US"
            currency="USD"
        >
            <BAR />
        </CommerceApiProvider>
    )
}

/*
test('useCommerceApi returns a set of api clients', () => {
    const wrapper = shallow(<FOO></FOO>)
    expect(wrapper.find('#shopperSearch')).to.have.lengthOf(1)
})
*/
test('useCommerceApi returns a set of api clients', () => {
    render(<App />)
    expect(screen.getByText(/shopperSearch/i)).toBeInTheDocument()
})
