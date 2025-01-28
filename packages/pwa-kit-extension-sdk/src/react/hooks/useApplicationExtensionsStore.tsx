/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {create} from 'zustand'
import {devtools} from 'zustand/middleware'

// export type SliceInitializer<T> = (set: (partial: any) => void, get: () => BaseStore) => T
export type SliceInitializer<T> = (
    set: (partial: (state: T) => Partial<T>) => void,
    get: () => T
) => T

interface BaseStore {
    state: Record<string, any>
    addSlice: <T>(name: string, initializer: SliceInitializer<T>) => void
    getSlice: <T>(name: string) => T | undefined
}

/**
 * Zustand store for managing application extensions with dynamic slices.
 * Provides methods to add and retrieve slices of state dynamically.
 */
export const useApplicationExtensionsStore = create<BaseStore>()(
    devtools((set, get) => ({
        /**
         * The state object containing all slices of the store.
         * Each slice is keyed by its name and holds its specific state.
         */
        state: {},

        /**
         * Dynamically adds a slice to the store.
         */
        addSlice: <T,>(name: string, initializer: SliceInitializer<T>) => {
            set((state: {state: Record<string, any>}) => ({
                state: {
                    ...state.state,
                    [name]: initializer(
                        // Narrowed version of set. Which allows setting state of the current slice only.
                        (action: (state: T) => Partial<T>) => {
                            set((state: {state: Record<string, any>}) => ({
                                state: {
                                    ...state.state,
                                    [name]: {
                                        ...state.state[name],
                                        ...action(state.state[name])
                                    }
                                }
                            }))
                        },
                        // Narrowed version of get. Which returns state of the current slice.
                        () => get().state[name]
                    )
                }
            }))
        },

        /**
         * Retrieves a slice of state from the store by its name.
         */
        getSlice: <T,>(name: string): T | undefined => {
            return get().state[name]
        }
    }))
)
