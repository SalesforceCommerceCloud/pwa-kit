/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import * as Runtypes from 'runtypes'

import {
    Text,
    CategoryID,
    ProductID,
    URL,
    Image,
    Identifier,
    Integer,
    Meta,
    Nullable
} from '../types'

const IconID = Identifier

export const CategoryInfo = Runtypes.Record({
    id: CategoryID,
    href: URL,
    title: Text,
    // Top-level categories have parentId = null
    parentId: Nullable(CategoryID) // eslint-disable-line new-cap
}).And(
    Runtypes.Partial({
        pageMeta: Meta,
        icon: Runtypes.Union(IconID, Image),
        description: Text
    })
)

export const CategoryContents = Runtypes.Record({
    itemCount: Integer,
    products: Runtypes.Array(ProductID)
})

export const Category = CategoryInfo.And(CategoryContents)

export const Categories = Runtypes.Dictionary(Category, CategoryID)
