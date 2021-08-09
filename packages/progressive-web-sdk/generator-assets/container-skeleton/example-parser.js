/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2017 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const <%= context.name %>Parser = ($, $html) => {
    const body = $html.find('body').html()

    return {
        testText: '<%= context.name %> Page',
        body
    }
}

export default <%= context.name %>Parser
