/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import {addNotification} from '../../store/notifications/actions'
import * as actions from './actions'

test('messagingNotSupportedNotification dispatches addNotification', () => {
    const mockStore = configureMockStore([thunk])
    const store = mockStore({})
    const notificationText =
        'Notifications are currently blocked for this site. Open "Settings" to allow notifications.'
    const expectedAction = [addNotification('messagingNotSupported', notificationText, true)]

    store.dispatch(actions.messagingNotSupportedNotification(notificationText))
    expect(store.getActions()).toEqual(expectedAction)
})
