/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createActionWithAnalytics} from '../utils/action-creation'
import {
    EVENT_ACTION,
    Page,
    Product,
    ShoppingList,
    UIInteraction,
    UI_SUBJECT,
    UI_ACTION,
    UI_OBJECT,
    UI_NAME
} from './data-objects/'
import analyticsManager, {hasAnalyticsNameAttribute, DATA_NAME} from './analytics-manager'
import {extractPathFromURL} from '../utils/utils'
import {getCartSummaryCount, getSubtotal} from '../store/cart/selectors'
import {getProductById} from '../store/products/selectors'
import {getWishlistItemCount} from '../store/user/selectors'
import {actionTypes} from 'redux-form'

export const onPageReady = createActionWithAnalytics(
    'Send pageview analytics',
    [],
    EVENT_ACTION.pageview,
    (routeName) => new Page({[Page.TEMPLATENAME]: routeName})
)

export const sendOfflinePageview = createActionWithAnalytics(
    'Send offline pageview analytics',
    [],
    EVENT_ACTION.pageview,
    (url, routeName, title, offlineSuccess) =>
        new Page({
            [Page.LOCATION]: url,
            [Page.PATH]: extractPathFromURL(url, false, false),
            [Page.TITLE]: title,
            [Page.TEMPLATENAME]: routeName,
            status: offlineSuccess ? 'offline_success' : 'offline_failed'
        })
)

export const sendOfflineModeUsedAnalytics = createActionWithAnalytics(
    'Send Offline mode used analytics',
    [],
    EVENT_ACTION.offlineModeUsed,
    (durationOfOffline, timestamp, pagesViewed) => {
        const offlinePageFailed = pagesViewed.filter(({inCache}) => !inCache).length
        const offlinePageSuccess = pagesViewed.length - offlinePageFailed
        return {
            durationOfOffline,
            timestamp,
            offlinePageFailed,
            offlinePageSuccess
        }
    }
)

export const setCurrencyCode = createActionWithAnalytics(
    'Set currency code for analytics',
    [],
    EVENT_ACTION.setCurrency,
    (currencyCode) => ({currencyCode})
)

export const setPageTemplateName = createActionWithAnalytics(
    'Set page template name',
    [],
    EVENT_ACTION.setPageTemplateName,
    /* istanbul ignore next */
    (templateName) => ({templateName})
)

export const countAsset = () => analyticsManager.countAsset()

export const trackPerformance = (type, value) => analyticsManager.collectPerformance(type, value)

/**
 * Cart Analytics
 */
const createCartAnalyticsMeta = (count, subtotal, product) => ({
    cart: new ShoppingList({
        [ShoppingList.TYPE]: 'cart',
        count,
        subtotal
    }),
    product
})

const sendAddToCartAnalytics = createActionWithAnalytics(
    'Send cart analytics',
    [],
    EVENT_ACTION.addToCart,
    createCartAnalyticsMeta
)
const sendRemoveFromCartAnalytics = createActionWithAnalytics(
    'Send cart analytics',
    [],
    EVENT_ACTION.removeFromCart,
    createCartAnalyticsMeta
)

export const dispatchCartAnalytics = (action, dispatch, getState, productId, quantity) => {
    const currentState = getState()
    const cartCount = getCartSummaryCount(currentState)
    const subtotal = getSubtotal(currentState)
    const productData = getProductById(productId)(currentState).toJS()
    const product = new Product(
        quantity !== undefined
            ? {
                  ...productData,
                  [Product.QUANTITY]: quantity
              }
            : productData
    )
    const actionCreator =
        action === EVENT_ACTION.addToCart ? sendAddToCartAnalytics : sendRemoveFromCartAnalytics

    dispatch(actionCreator(cartCount, subtotal, product))
}

const createWishlistAnalyticsMeta = (count, product) => ({
    cart: new ShoppingList({
        [ShoppingList.TYPE]: UI_NAME.wishlist,
        count
    }),
    product
})

const sendAddToWishlistAnalytics = createActionWithAnalytics(
    'Send wishlist analytics',
    [],
    EVENT_ACTION.addToWishlist,
    createWishlistAnalyticsMeta
)
const sendRemoveFromWishlistAnalytics = createActionWithAnalytics(
    'Send wishlist analytics',
    [],
    EVENT_ACTION.removeFromWishlist,
    createWishlistAnalyticsMeta
)

export const dispatchWishlistAnalytics = (action, dispatch, getState, productId, quantity) => {
    const currentState = getState()
    let wishlistCount = parseInt(getWishlistItemCount(currentState))
    const product = new Product(getProductById(productId)(currentState).toJS())
    const isAddAction = action === EVENT_ACTION.addToWishlist
    const actionCreator = isAddAction ? sendAddToWishlistAnalytics : sendRemoveFromWishlistAnalytics

    if (isAddAction) {
        wishlistCount += parseInt(quantity)
    }

    dispatch(actionCreator(`${wishlistCount}`, product))
}

/**
 * Modal Analytics
 */
export const createModalAnalyticsMeta = (action, name, analyticsName) => {
    return new UIInteraction({
        [UIInteraction.SUBJECT]: UI_SUBJECT.app,
        [UIInteraction.ACTION]: action,
        [UIInteraction.OBJECT]: UI_OBJECT.modal,
        name: analyticsName || name
    })
}

/**
 * Form Field Validation Error Analytics
 */
export const sendFormFieldValidationErrorsAnalytics = ({formId, fields}) => {
    const form = document.getElementById(formId)
    if (!(form && hasAnalyticsNameAttribute(form, 'Form', analyticsManager.options.debug))) {
        return
    }

    const formAnalyticsName = form.getAttribute(DATA_NAME)

    /* istanbul ignore else */
    if (fields) {
        Object.keys(fields).forEach((fieldName) => {
            if (fieldName === '_error') {
                analyticsManager.distribute(
                    EVENT_ACTION.uiInteraction,
                    new UIInteraction({
                        [UIInteraction.SUBJECT]: UI_SUBJECT.app,
                        [UIInteraction.ACTION]: UI_ACTION.display,
                        [UIInteraction.OBJECT]: UI_OBJECT.error,
                        [UIInteraction.NAME]: `${formAnalyticsName}_form`,
                        [UIInteraction.CONTENT]: fields[fieldName]
                    })
                )
            } else {
                const element = document.querySelectorAll(`#${formId} [name="${fieldName}"]`)[0]

                if (
                    element &&
                    hasAnalyticsNameAttribute(element, 'Element', analyticsManager.options.debug)
                ) {
                    const elementAnalyticsName = element.getAttribute(DATA_NAME)
                    analyticsManager.distribute(
                        EVENT_ACTION.uiInteraction,
                        new UIInteraction({
                            [UIInteraction.SUBJECT]: UI_SUBJECT.app,
                            [UIInteraction.ACTION]: UI_ACTION.display,
                            [UIInteraction.OBJECT]: UI_OBJECT.error,
                            [UIInteraction.NAME]: `${formAnalyticsName}_form:${elementAnalyticsName}`,
                            [UIInteraction.CONTENT]: fields[fieldName]
                        })
                    )
                }
            }
        })
    }
}

/**
 * Redux Form plugin for tracking form validation errors
 */
let lastUpdateSyncError
export const ReduxFormPluginOption = {
    all: (state, action) => {
        // Tracking form errors
        try {
            if (action.type === actionTypes.STOP_SUBMIT) {
                // Track submit validation errors
                sendFormFieldValidationErrorsAnalytics({
                    formId: action.meta.form,
                    fields: action.payload
                })
                lastUpdateSyncError = undefined
            } else if (action.type === actionTypes.UPDATE_SYNC_ERRORS) {
                // Keep reference of the last update sync errors
                lastUpdateSyncError = action
            } else if (
                lastUpdateSyncError &&
                action.meta &&
                action.meta.field &&
                lastUpdateSyncError.payload.syncErrors[action.meta.field] &&
                action.type === actionTypes.BLUR
            ) {
                // Track sync validation errors happening on input blur
                sendFormFieldValidationErrorsAnalytics({
                    formId: lastUpdateSyncError.meta.form,
                    fields: {
                        [action.meta.field]:
                            lastUpdateSyncError.payload.syncErrors[action.meta.field]
                    }
                })
            } else if (lastUpdateSyncError && action.type === actionTypes.SET_SUBMIT_FAILED) {
                // Track sync validation errors when submit failed
                sendFormFieldValidationErrorsAnalytics({
                    formId: lastUpdateSyncError.meta.form,
                    fields: lastUpdateSyncError.payload.syncErrors
                })
                lastUpdateSyncError = undefined
            }
        } catch (e) {
            analyticsManager.distribute(
                EVENT_ACTION.uiInteraction,
                new UIInteraction({
                    [UIInteraction.SUBJECT]: UI_SUBJECT.app,
                    [UIInteraction.ACTION]: UI_ACTION.receive,
                    [UIInteraction.OBJECT]: UI_OBJECT.error,
                    [UIInteraction.NAME]: `Redux Form Plugin error`
                })
            )
        }
        return state
    }
}

/**
 * Form Submit Error Analytics
 */
export const sendFormSubmitErrorsAnalytics = (fieldErrors) => {
    Object.keys(fieldErrors).forEach((key) => {
        analyticsManager.distribute(
            EVENT_ACTION.uiInteraction,
            new UIInteraction({
                [UIInteraction.SUBJECT]: UI_SUBJECT.app,
                [UIInteraction.ACTION]: UI_ACTION.display,
                [UIInteraction.OBJECT]: UI_OBJECT.error,
                [UIInteraction.NAME]: 'submit',
                [UIInteraction.CONTENT]: fieldErrors[key]
            })
        )
    })
}

/**
 * Form Submit Error Wrapper
 */
export const formSubmitErrorWrapper = (functionResult) => (dispatch) => {
    return dispatch(functionResult).catch((error) => {
        sendFormSubmitErrorsAnalytics(error.errors)
        throw error
    })
}

/**
 * A2HS Analytics
 */

export const sendA2HSPromptAnalytics = createActionWithAnalytics(
    'Send A2HS Prompt analytics',
    [],
    EVENT_ACTION.uiInteraction,
    () =>
        new UIInteraction({
            [UIInteraction.SUBJECT]: UI_SUBJECT.app,
            [UIInteraction.ACTION]: UI_ACTION.display,
            [UIInteraction.OBJECT]: UI_OBJECT.element,
            name: `${UI_NAME.addToHome}:${UI_NAME.prompt}`
        })
)

export const sendA2HSUserPromptAnalytics = createActionWithAnalytics(
    'Send A2HS Prompt analytics',
    [],
    EVENT_ACTION.uiInteraction,
    () =>
        new UIInteraction({
            [UIInteraction.SUBJECT]: UI_SUBJECT.user,
            [UIInteraction.ACTION]: UI_ACTION.display,
            [UIInteraction.OBJECT]: UI_OBJECT.element,
            name: `${UI_NAME.addToHome}:${UI_NAME.prompt}`
        })
)

export const sendAddA2HSAnalytics = createActionWithAnalytics(
    'Send Add A2HS analytics',
    [],
    EVENT_ACTION.uiInteraction,
    () =>
        new UIInteraction({
            [UIInteraction.SUBJECT]: UI_SUBJECT.user,
            [UIInteraction.ACTION]: UI_ACTION.click,
            [UIInteraction.OBJECT]: UI_OBJECT.button,
            name: `${UI_NAME.addToHome}:${UI_NAME.accept}`
        })
)

export const sendDismissA2HSAnalytics = createActionWithAnalytics(
    'Send Dismiss A2HS analytics',
    [],
    EVENT_ACTION.uiInteraction,
    () =>
        new UIInteraction({
            [UIInteraction.SUBJECT]: UI_SUBJECT.user,
            [UIInteraction.ACTION]: UI_ACTION.click,
            [UIInteraction.OBJECT]: UI_OBJECT.button,
            name: `${UI_NAME.addToHome}:${UI_NAME.dismiss}`
        })
)

export const sendLaunchedFromHomeScreenAnalytics = createActionWithAnalytics(
    'Send launched from homescreen analytics',
    [],
    EVENT_ACTION.launchedFromHomeScreen,
    () =>
        new UIInteraction({
            [UIInteraction.SUBJECT]: UI_SUBJECT.user,
            [UIInteraction.ACTION]: UI_ACTION.click,
            [UIInteraction.OBJECT]: UI_OBJECT.button,
            name: `${UI_NAME.addToHome}:${UI_NAME.launch}`
        })
)

/**
 * Product Impression Analytics
 */
export const sendProductImpressionAnalytics = createActionWithAnalytics(
    'Send product impression analytics',
    [],
    EVENT_ACTION.productImpression,
    (productId) => ({productId})
)

/**
 * Product Detail Analytics
 */
export const sendProductDetailAnalytics = createActionWithAnalytics(
    'Send product detatil analytics',
    [],
    EVENT_ACTION.productDetail
)

/**
 * Apple Pay Analytics
 */
export const sendApplePayOptionDisplayedAnalytics = createActionWithAnalytics(
    'Send Apple Pay option displayed analytics',
    [],
    EVENT_ACTION.applePayOptionDisplayed
)

export const sendApplePayButtonDisplayedAnalytics = createActionWithAnalytics(
    'Send Apple Pay button displayed analytics',
    [],
    EVENT_ACTION.applePayButtonDisplayed
)

export const sendApplePayButtonClickedAnalytics = createActionWithAnalytics(
    'Send Apple Pay button clicked analytics',
    [],
    EVENT_ACTION.applePayButtonClicked
)
