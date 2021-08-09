/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const processRequest = ({getRequestClass, setRequestClass, path, querystring, parameters}) => {
    if (path === '/test-request-processor') {
        console.log(`getRequestClass returns ${getRequestClass()}`)
        setRequestClass('bot')
        return {
            path: '/altered',
            querystring: 'foo=bar'
        }
    }

    if (path === '/test-request-processor2') {
        return {
            path: '/altered2',
            querystring: ''
        }
    }

    if (path === '/test-request-processor3') {
        return
    }

    return {
        path,
        querystring
    }
}

module.exports = {
    processRequest
}
