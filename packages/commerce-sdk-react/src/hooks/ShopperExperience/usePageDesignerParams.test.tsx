/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook} from '@testing-library/react'
import {usePageDesignerParams} from './usePageDesignerParams'
import useConfig from '../useConfig'

jest.mock('../useConfig')
const mockUseConfig = useConfig as jest.MockedFunction<typeof useConfig>

describe('usePageDesignerParams', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('returns empty object when no pageDesignerParams provided', () => {
        mockUseConfig.mockReturnValue({} as any)
        const {result} = renderHook(() => usePageDesignerParams())
        expect(result.current).toEqual({})
    })

    test('returns mode when provided', () => {
        mockUseConfig.mockReturnValue({pageDesignerParams: {mode: 'edit'}} as any)
        const {result} = renderHook(() => usePageDesignerParams())
        expect(result.current.mode).toBe('edit')
    })

    test('returns pdToken when provided', () => {
        mockUseConfig.mockReturnValue({pageDesignerParams: {pdToken: 'test-token'}} as any)
        const {result} = renderHook(() => usePageDesignerParams())
        expect(result.current.pdToken).toBe('test-token')
    })

    test('returns pageId when provided', () => {
        mockUseConfig.mockReturnValue({pageDesignerParams: {pageId: 'test-page-id'}} as any)
        const {result} = renderHook(() => usePageDesignerParams())
        expect(result.current.pageId).toBe('test-page-id')
    })

    test('returns all params when all provided', () => {
        const pageDesignerParams = {
            mode: 'preview' as const,
            pdToken: 'my-token',
            pageId: 'my-page'
        }
        mockUseConfig.mockReturnValue({pageDesignerParams} as any)
        const {result} = renderHook(() => usePageDesignerParams())
        expect(result.current).toEqual(pageDesignerParams)
    })

    test('returns partial params when partially provided', () => {
        mockUseConfig.mockReturnValue({
            pageDesignerParams: {mode: 'edit', pdToken: 'token'}
        } as any)
        const {result} = renderHook(() => usePageDesignerParams())
        expect(result.current.mode).toBe('edit')
        expect(result.current.pdToken).toBe('token')
        expect(result.current.pageId).toBeUndefined()
    })
})
