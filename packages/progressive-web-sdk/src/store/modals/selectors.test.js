/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import Immutable from 'immutable'
import {getPreRenderingModals, isModalOpen} from './selectors'

const OPENED_MODAL = 'opened-modal'
const CLOSED_MODAL = 'closed-modal'

test('getPreRenderingModals creates a selector that returns all prerendered modals', () => {
    const state = {
        modals: Immutable.fromJS({
            [OPENED_MODAL]: {
                open: true
            },
            [CLOSED_MODAL]: {
                open: false,
                prerender: true
            }
        })
    }

    const selectedState = getPreRenderingModals(state)

    // The prerendered modal state has not change
    expect(selectedState.getIn([CLOSED_MODAL, 'open'])).toBeFalsy()
    expect(selectedState.getIn([CLOSED_MODAL, 'prerender'])).toBeTruthy()

    // There should only be one persistent modal
    expect(selectedState.size).toBe(1)
})

test('isModalOpen creates selectors that check the given modal is open', () => {
    const state = {
        modals: Immutable.fromJS({
            [OPENED_MODAL]: {open: true},
            [CLOSED_MODAL]: {open: false}
        })
    }

    expect(isModalOpen(OPENED_MODAL)(state)).toBeTruthy()
    expect(isModalOpen(CLOSED_MODAL)(state)).toBeFalsy()
    expect(isModalOpen('non-existant-modal')(state)).toBeFalsy()
})
