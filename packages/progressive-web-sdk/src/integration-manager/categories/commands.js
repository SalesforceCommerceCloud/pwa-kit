/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

let connector = {}

export const register = (commands) => {
    connector = commands
}

/**
 * Initializes any required data for the Product List page
 * @function
 * @param {string} url The url of the current page
 * @param {string} routeName The route name of the current page
 */
export const initProductListPage = (url, routeName) => connector.initProductListPage(url, routeName)
