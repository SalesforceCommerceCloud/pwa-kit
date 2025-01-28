/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// The @jest-environment comment block *MUST* be the first line of the file for the tests to pass.
// That conflicts with the monorepo header rule, so we must disable the rule!
/* eslint-disable header/header */
import {useApplicationExtensionsStore, SliceInitializer} from './useApplicationExtensionsStore'

describe('useApplicationExtensionsStore', () => {
    afterEach(() => {
        // Reset the store state after each test
        useApplicationExtensionsStore.setState({state: {}})
    })

    it('should initialize the store with an empty state', () => {
        const {state} = useApplicationExtensionsStore.getState()
        expect(state).toEqual({})
    })

    it('should add a slice to the store', () => {
        const sliceName = 'testSlice'
        const sliceInitializer: SliceInitializer<{count: number; increment: () => void}> = (
            set
        ) => ({
            count: 0,
            increment: () => set((state: any) => ({count: (state.count as number) + 1}))
        })

        useApplicationExtensionsStore.getState().addSlice(sliceName, sliceInitializer)

        const slice = useApplicationExtensionsStore
            .getState()
            .getSlice<{count: number; increment: () => void}>(sliceName)
        expect(slice).toBeDefined()
        expect(slice).toHaveProperty('count', 0)
        expect(typeof slice?.increment).toBe('function')
    })

    it('should update the slice state when a slice action is called', () => {
        const sliceName = 'counterSlice'
        const sliceInitializer: SliceInitializer<{count: number; increment: () => void}> = (
            set
        ) => ({
            count: 0,
            increment: () => set((state: any) => ({count: (state.count as number) + 1}))
        })

        useApplicationExtensionsStore.getState().addSlice(sliceName, sliceInitializer)

        const slice = useApplicationExtensionsStore
            .getState()
            .getSlice<{count: number; increment: () => void}>(sliceName)

        // Call the increment action
        slice?.increment()

        const updatedSlice = useApplicationExtensionsStore
            .getState()
            .getSlice<{count: number; increment: () => void}>(sliceName)
        expect(updatedSlice?.count).toBe(1)
    })

    it('should retrieve the correct slice using getSlice', () => {
        const sliceName1 = 'slice1'
        const sliceName2 = 'slice2'

        const sliceInitializer1: SliceInitializer<{value: string}> = () => ({
            value: 'Slice 1'
        })

        const sliceInitializer2: SliceInitializer<{value: string}> = () => ({
            value: 'Slice 2'
        })

        useApplicationExtensionsStore.getState().addSlice(sliceName1, sliceInitializer1)
        useApplicationExtensionsStore.getState().addSlice(sliceName2, sliceInitializer2)

        const slice1 = useApplicationExtensionsStore.getState().getSlice(sliceName1)
        const slice2 = useApplicationExtensionsStore.getState().getSlice(sliceName2)

        expect(slice1).toHaveProperty('value', 'Slice 1')
        expect(slice2).toHaveProperty('value', 'Slice 2')
    })

    it('should not throw an error when retrieving a non-existent slice', () => {
        const slice = useApplicationExtensionsStore.getState().getSlice('nonExistentSlice')
        expect(slice).toBeUndefined()
    })

    it('should handle multiple updates to a slice', () => {
        const sliceName = 'multiUpdateSlice'
        const sliceInitializer: SliceInitializer<{count: number; increment: () => void}> = (
            set
        ) => ({
            count: 0,
            increment: () => set((state: any) => ({count: (state.count as number) + 1}))
        })

        useApplicationExtensionsStore.getState().addSlice(sliceName, sliceInitializer)

        const slice = useApplicationExtensionsStore
            .getState()
            .getSlice<{count: number; increment: () => void}>(sliceName)

        // Increment multiple times
        slice?.increment()
        slice?.increment()
        slice?.increment()

        const updatedSlice = useApplicationExtensionsStore
            .getState()
            .getSlice<{count: number; increment: () => void}>(sliceName)
        expect(updatedSlice?.count).toBe(3)
    })
})
