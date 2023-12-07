/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act, waitFor} from '@testing-library/react'
import {useIdpCallback} from '@salesforce/retail-react-app/app/hooks/use-idp-callback'

let mockSearchParams = jest.fn()
let mockProcessIdpResult = null

jest.mock('@salesforce/retail-react-app/app/hooks/use-idp-auth', () => {
    return jest.fn(() => ({
        processIdpResult: mockProcessIdpResult
    }))
})
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: jest.fn().mockReturnValue({data: 'mockCustomer'})
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-search-params', () => ({
    useSearchParams: () => [mockSearchParams()]
}))

const LABELS = {
    missingParameters: 'mockMissingParameters'
}
describe('useIdpCallback', () => {
    it('should handle error in URL parameters', async () => {
        mockSearchParams.mockReturnValue({error_description: 'mockError'})

        const {result} = renderHook(() => useIdpCallback({labels: LABELS}))
        await waitFor(() => expect(result.current.error).toBe('mockError'))
    })

    it('should handle missing usid and code in URL parameters', async () => {
        mockSearchParams.mockReturnValue({usid: null, code: null})

        const {result} = renderHook(() => useIdpCallback({labels: LABELS}))

        await waitFor(() => {
            expect(result.current.error).toBeDefined()
            expect(result.current.error).toBe(LABELS.missingParameters)
        })
    })

    it('should handle successful processIdpResult', async () => {
        mockSearchParams.mockReturnValue({usid: 'mockUsid', code: 'mockCode'})
        mockProcessIdpResult = jest.fn().mockResolvedValue('mockCustomer')

        const {result} = renderHook(() => useIdpCallback({labels: LABELS}))

        await waitFor(() => {
            expect(result.current.error).toBeUndefined()
            expect(mockProcessIdpResult).toHaveBeenCalledWith('mockUsid', 'mockCode')
        })
    })

    it('should handle error in processIdpResult', async () => {
        mockSearchParams.mockReturnValue({usid: 'mockUsid', code: 'mockCode'})
        mockProcessIdpResult = jest.fn().mockRejectedValue({message: 'mockError'})

        const {result} = renderHook(() => useIdpCallback({labels: LABELS}))

        await waitFor(() => expect(result.current.error).toBe('mockError'))
    })
})
