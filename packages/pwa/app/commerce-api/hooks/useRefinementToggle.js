/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
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
