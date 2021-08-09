import {createStore, compose, applyMiddleware} from 'redux'
import thunk from 'redux-thunk'
import Immutable from 'immutable'
import analyticsMiddleware from './analytics/middleware'
import {runningServerSide} from 'progressive-web-sdk/dist/utils/utils'
import reducer from './reducer'

const isServerSide = runningServerSide()

/**
 * Restore a previously-frozen app state for use as the initial data when building
 * the redux store.
 */
export const restoreFromFrozen = (frozen) => {
    if (!frozen) {
        return undefined
    } else {
        return Object.assign(
            {},
            ...Object.keys(frozen).map((key) => {
                switch (key) {
                    case 'ui':
                    case 'data':
                        return {
                            [key]: Object.assign(
                                {},
                                ...Object.keys(frozen[key]).map((k) => {
                                    switch (k) {
                                        case 'pages':
                                            return {
                                                [k]: Object.assign(
                                                    {},
                                                    ...Object.keys(frozen[key][k]).map((k1) => ({
                                                        [k1]: Immutable.fromJS(frozen[key][k][k1])
                                                    }))
                                                )
                                            }
                                        default:
                                            return {[k]: Immutable.fromJS(frozen[key][k])}
                                    }
                                })
                            )
                        }
                    default:
                        return {[key]: Immutable.fromJS(frozen[key])}
                }
            })
        )
    }
}

export const configureStore = (connector) => {
    const initialState = restoreFromFrozen(window.__PRELOADED_STATE__)

    const middlewares = [thunk.withExtraArgument({connector})]

    if (!isServerSide) {
        middlewares.push(analyticsMiddleware)
    }

    const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
            serialize: { // prettier-ignore
                immutable: Immutable
            }
        }) // prettier-ignore
        : compose

    return createStore(reducer, initialState, composeEnhancers(applyMiddleware(...middlewares)))
}

export default configureStore
