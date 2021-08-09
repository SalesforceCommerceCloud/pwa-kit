/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */


export const RECEIVE_<%= context.NAME %> = 'RECEIVE_<%= context.NAME %>'

export const receive<%= context.Name %> = (example) => {
    return {
        type: RECEIVE_<%= context.NAME %>,
        payload: {
            example
        }
    }
}


export const initialize<%= context.Name %> = (id) => (dispatch, getState, {connector}) => {
    // Use the injected connector to fetch data here, eg. `connector.getProduct(id)`
    return Promise.resolve({id, data: 'data'})
        .then((data) => dispatch(receive<%= context.Name %>(data)))
}
