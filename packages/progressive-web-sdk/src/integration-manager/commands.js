/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {register as registerHome} from './home/commands'
import {register as registerProducts} from './products/commands'
import {register as registerCategories} from './categories/commands'
import {register as registerCart} from './cart/commands'
import {register as registerApp} from './app/commands'
import {register as registerCheckout} from './checkout/commands'
import {register as registerAccount} from './account/commands'
import {register as registerCustomCommands} from './custom/commands'

let connector = {}

export const register = (commands) => {
    connector = commands
    registerApp(commands.app)
    registerHome(commands.home)
    registerProducts(commands.products)
    registerCategories(commands.categories)
    registerCart(commands.cart)
    registerCheckout(commands.checkout)
    registerAccount(commands.account)
}

export const registerCustom = (commands) => {
    registerCustomCommands(commands)
}

/** @function */
export const submitNewsletter = (...args) => connector.submitNewsletter(...args)

/** @function */
export const getSearchSuggestions = (...args) => connector.getSearchSuggestions(...args)
