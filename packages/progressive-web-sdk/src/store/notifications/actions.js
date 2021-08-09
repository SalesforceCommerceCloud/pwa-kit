/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createAction} from '../../utils/action-creation'

export const addNotification = createAction('Add Notification', [
    'id',
    'content',
    'showRemoveButton'
])
export const removeNotification = createAction('Remove Notification')
export const removeAllNotifications = createAction('Remove All Notifications')
