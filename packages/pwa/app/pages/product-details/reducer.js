import Immutable from 'immutable'

import {PRODUCT_DETAILS_UI_STATE_RECEIVED} from './actions'

const initialState = Immutable.Map({
    isShippingSheetOpen: false,
    isSubscribed: false
})

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case PRODUCT_DETAILS_UI_STATE_RECEIVED:
            return state.mergeDeepWith((oldValue, newValue) => {
                return typeof newValue === 'object'
                    ? Immutable.fromJS({...oldValue, ...newValue.toJS()})
                    : newValue
            }, action.payload)
        default:
            return state
    }
}

export default reducer
