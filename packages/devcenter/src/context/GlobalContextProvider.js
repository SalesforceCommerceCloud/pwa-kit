import React, {useReducer} from 'react'
import {extractUrls, getMobileActivePath} from '../utils/helpers'
import PropTypes from 'prop-types'

export const GlobalStateContext = React.createContext()
export const GlobalDispatchContext = React.createContext()

const currentPathname = typeof document !== 'undefined' ? document.location.pathname : ''
const defaultOpenUrls = extractUrls(currentPathname)
const defaultMobileNavPath = getMobileActivePath(currentPathname)
const initialState = {
    topBanner: true,
    isOpen: [...defaultOpenUrls],
    mobileNavPath: defaultMobileNavPath,
    bannerHeight: 0
}

function reducer(state, action) {
    switch (action.type) {
        case 'TOGGLE_NAV_COLLAPSED': {
            return {
                ...state,
                isOpen: state.isOpen.includes(action.group)
                    ? state.isOpen.filter((group) => group !== action.group)
                    : state.isOpen.concat(action.group)
            }
        }
        case 'SET_MOBILE_NAV_PATH':
            return {
                ...state,
                mobileNavPath: action.mobileNavPath
            }
        default:
            return {
                ...state
            }
    }
}

const GlobalContextProvider = ({children}) => {
    const [state, dispatch] = useReducer(reducer, initialState)
    return (
        <GlobalStateContext.Provider value={state}>
            <GlobalDispatchContext.Provider value={dispatch}>
                {children}
            </GlobalDispatchContext.Provider>
        </GlobalStateContext.Provider>
    )
}

GlobalContextProvider.propTypes = {
    children: PropTypes.element.isRequired
}
export default GlobalContextProvider
