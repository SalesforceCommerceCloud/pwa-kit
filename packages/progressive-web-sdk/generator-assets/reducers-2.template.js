/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2017 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// THIS IS A GENERATED FILE, DO NOT EDIT

import {combineReducers} from 'redux'

<% print('import navigation from \'../modals/navigation/reducer\' // navigation is a special case, since it\'s not in the containers directory') %>
<% print(context.containers.map((container) => `import ${container.identifier} from './${container.directory}/reducer'`).join('\n')) %>
<% if (context.custom) print('import * as customReducers from \'./custom-reducers\'') %>

const uiReducer = combineReducers({
<% print('    navigation,') %>
<% print(context.containers.map((container) => `    ${container.identifier},`).join('\n')) %>
<% if (context.custom) print('    ...customReducers') %>
})

export default uiReducer
