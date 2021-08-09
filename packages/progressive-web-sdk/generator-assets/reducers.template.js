/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2017 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// THIS IS A GENERATED FILE, DO NOT EDIT

import {combineReducers} from 'redux'

<% print(context.containers.map((container) => `import ${container.identifier} from './${container.directory}/reducer'`).join('\n')) %>
import {reducer as formReducer} from 'redux-form'
<% if (context.custom) print('import * as customReducers from \'./custom-reducers\'') %>

const rootReducer = combineReducers({
<% print(context.containers.map((container) => `    ${container.identifier},`).join('\n')) %>
    form: formReducer,
<% if (context.custom) print('    ...customReducers') %>
})

export default rootReducer
