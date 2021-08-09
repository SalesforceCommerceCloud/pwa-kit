import {pageMetaDataReceived, initializeApp} from '../../actions'

export const HOME_UI_STATE_RECEIVED = 'HOME_UI_STATE_RECEIVED'

export const updateHomeUIState = (payload) => ({type: HOME_UI_STATE_RECEIVED, payload})

export const initializeHome = () => (dispatch) => {
    return Promise.all([
        dispatch(initializeApp()),
        dispatch(
            pageMetaDataReceived({
                pageMetaData: {
                    title: 'Scaffold Home',
                    description: 'Homepage for the Scaffold'
                }
            })
        )
    ])
        .then(() => ({statusCode: 200}))
        .catch((err) => ({statusCode: err.statusCode || 500}))
}
