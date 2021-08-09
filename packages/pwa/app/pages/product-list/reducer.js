import Immutable from 'immutable'

import {CATEGORY_LIST_UI_STATE_RECEIVED} from './actions'

const initialState = Immutable.Map()

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case CATEGORY_LIST_UI_STATE_RECEIVED:
            return state.mergeDeep(action.payload)
        default:
            return state
    }
}

export default reducer
