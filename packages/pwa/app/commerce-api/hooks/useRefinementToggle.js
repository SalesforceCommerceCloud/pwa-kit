/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState} from 'react'

/**
 * Hook for handling the UI state of refinements
 */
const useRefinementToggle = () => {
    const [state, setState] = useState({selectedRefinements: undefined})
    return {
        ...state,
        /**
         * Manages an array of selected refinements for the UI to use for instant feedback
         *
         * @param {string} value
         * @param {boolean} selected
         */
        applyUIFeedback(value, selected) {
            if (!selected) {
                const updatedSelectedRefinements = state.selectedRefinements || []
                updatedSelectedRefinements.push(value.value)
                setState({selectedRefinements: updatedSelectedRefinements})
            } else {
                const updatedSelectedRefinements = state.selectedRefinements.filter(
                    (item) => item !== value.value
                )
                setState({selectedRefinements: updatedSelectedRefinements})
            }
        },
        /**
         * Updates the state when the selected refinements are updated
         *
         * @param {array} refinements
         */
        setSelectedRefinements(refinements) {
            setState({selectedRefinements: refinements})
        }
    }
}

export default useRefinementToggle
