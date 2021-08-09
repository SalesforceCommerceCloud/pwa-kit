/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createAction, createActionWithAnalytics} from '../../utils/action-creation'
import {EVENT_ACTION, UI_ACTION, UI_NAME} from '../../analytics/data-objects/'
import {createModalAnalyticsMeta} from '../../analytics/actions'

export const openModal = createActionWithAnalytics(
    'Open modal',
    ['modalName'],
    EVENT_ACTION.uiInteraction,
    (name, analyticsName) => createModalAnalyticsMeta(UI_ACTION.open, name, analyticsName)
)

export const closeModal = createActionWithAnalytics(
    'Close modal',
    ['modalName'],
    EVENT_ACTION.uiInteraction,
    (name, analyticsName) => createModalAnalyticsMeta(UI_ACTION.close, name, analyticsName)
)

// A persistent modal will not be closed after route change
export const openPersistentModal = createActionWithAnalytics(
    'Open persistent modal',
    ['modalName'],
    EVENT_ACTION.uiInteraction,
    (name, analyticsName) => createModalAnalyticsMeta(UI_ACTION.open, name, analyticsName)
)

export const closeAllModals = createActionWithAnalytics(
    'Close all modals',
    [],
    EVENT_ACTION.uiInteraction,
    () => createModalAnalyticsMeta(UI_ACTION.close, UI_NAME.all)
)

export const persistModal = createAction('Persist modal', ['modalName'])
export const preRenderModal = createAction('Pre-render modal', ['modalName'])
