import Immutable from 'immutable'

import {HOME_UI_STATE_RECEIVED} from './actions'

const initialState = Immutable.Map()

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case HOME_UI_STATE_RECEIVED:
            return state.mergeDeep(action.payload)
        default:
            return state
    }
}

export default reducer
