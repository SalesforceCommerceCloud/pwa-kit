/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createAction} from 'redux-actions'

import {typecheck} from '../../utils/typechecking'
import {CategoryID} from '../types'
import {CategoryInfo, CategoryContents} from './types'

export const receiveCategoryInformation = createAction(
    'Receive Category Information',
    (id, info) => ({
        [typecheck(CategoryID, id)]: typecheck(CategoryInfo, info)
    })
)

export const receiveCategoryContents = createAction(
    'Receive Category Contents',
    (id, contents) => ({
        [typecheck(CategoryID, id)]: typecheck(CategoryContents, contents)
    })
)

export const receiveCategorySortOptions = createAction(
    'Receive Category Sorting Options',
    (pathKey, options) => ({sortOptions: {[pathKey]: options}})
)

export const receiveCategoryFilterOptions = createAction(
    'Receive Category Filtering Options',
    (pathKey, options) => ({filterOptions: {[pathKey]: options}})
)
