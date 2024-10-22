/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act, waitFor} from '@testing-library/react'
import useIdpCallback from '@salesforce/retail-react-app/app/hooks/use-idp-callback'
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'
import {useSearchParams} from '@salesforce/retail-react-app/app/hooks/use-search-params'

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: jest.fn().mockReturnValue({data: 'mockCustomer'})
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-search-params')

jest.mock('@salesforce/commerce-sdk-react/hooks/useAuthContext', () => {
    return jest.fn().mockReturnValue({
        loginIDPUser: jest.fn().mockReturnValue({data: 'mockData'})
    })
})

const LABELS = {
    missingParameters: 'mockMissingParameters'
}
describe('useIdpCallback', () => {
    beforeEach(() => {
        useSearchParams.mockReset()
    })

    it('should handle error in URL parameters', async () => {
        useSearchParams.mockReturnValue([{error_description: 'mockError'}])

        const {result} = renderHook(() => useIdpCallback({labels: LABELS}))
        await waitFor(() => expect(result.current.authenticationError).toBe('mockError'))
    })

    it('should handle missing usid and code in URL parameters', async () => {
        useSearchParams.mockReturnValue([{usid: null, code: null}])

        const {result} = renderHook(() => useIdpCallback({labels: LABELS}))

        await waitFor(() => {
            expect(result.current.authenticationError).toBeDefined()
            expect(result.current.authenticationError).toBe(LABELS.missingParameters)
        })
    })

    it('should call loginIDPUser when all parameters are present', async () => {
        useSearchParams.mockReturnValue([{usid: 'mockUsid', code: 'mockCode'}])

        const {result} = renderHook(() => useIdpCallback({labels: LABELS}))

        await waitFor(() => {
            expect(result.current.authenticationError).toBeUndefined()
            expect(useAuthContext).toHaveBeenCalled()
            expect(useAuthContext().loginIDPUser).toHaveBeenCalledWith({
                usid: 'mockUsid',
                code: 'mockCode',
                redirectURI: 'https://www.domain.com/idp-callback'
            })
        })
    })
})
