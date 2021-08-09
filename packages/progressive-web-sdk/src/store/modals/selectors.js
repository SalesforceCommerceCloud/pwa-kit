/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createSelector} from 'reselect'
// import {createGetSelector} from 'reselect-immutable-helpers'

export const getModals = ({modals}) => modals

// @TODO: Deprecate getKnownModals
export const getKnownModals = ({modals}) => modals

export const getOpenModals = createSelector(
    getModals,
    (modals) => modals.filter((modal) => modal.get('open'))
)

export const getClosedModals = createSelector(
    getModals,
    (modals) => modals.filterNot((modal) => modal.get('open'))
)

export const getPreRenderingModals = createSelector(
    getClosedModals,
    (modals) => modals.filter((modal) => modal.get('prerender'))
)

export const isModalOpen = (modalName) =>
    createSelector(
        getOpenModals,
        (modals) => modals.getIn([modalName, 'open']) || false
    )
