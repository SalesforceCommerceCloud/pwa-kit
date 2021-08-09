/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createGetSelector} from 'reselect-immutable-helpers'
import {PAGE_COUNT, VISIT_COUNTDOWNS} from './constants'

export const getPushMessaging = ({pushMessaging}) => pushMessaging

export const isMessagingReady = createGetSelector(getPushMessaging, 'isReady') // Deprecated
export const isSupported = createGetSelector(getPushMessaging, 'isSupported', false)
export const isSubscribed = createGetSelector(getPushMessaging, 'subscribed')
export const canSubscribe = createGetSelector(getPushMessaging, 'canSubscribe')
export const getStatus = createGetSelector(getPushMessaging, 'status')

export const getPageCount = createGetSelector(getPushMessaging, PAGE_COUNT)
export const getVisitCountdowns = createGetSelector(getPushMessaging, VISIT_COUNTDOWNS)
export const getChannels = createGetSelector(getPushMessaging, 'channels')
export const isSystemAskShown = createGetSelector(getPushMessaging, 'systemAskShown')

export const getLocale = createGetSelector(getPushMessaging, 'locale')
