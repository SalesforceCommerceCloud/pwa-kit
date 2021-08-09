/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import * as Runtypes from 'runtypes'
import {Text, ProductID, Identifier, URL, Image, Meta, Money} from '../types'

const VariationCategoryID = Identifier
const VariationCategoryName = Identifier

const Link = Runtypes.Record({
    href: URL,
    text: Text
}).And(
    Runtypes.Partial({
        title: Text
    })
)

const Option = Runtypes.Record({
    value: Identifier,
    label: Text
})

const VariationCategory = Runtypes.Record({
    id: VariationCategoryID,
    name: VariationCategoryName,
    label: Text,
    values: Runtypes.Array(Option)
})

const Variant = Runtypes.Record({
    id: ProductID,
    values: Runtypes.Dictionary(VariationCategoryID, Identifier)
})

const Product = Runtypes.Record({
    id: ProductID,
    title: Text,
    price: Money,
    href: URL,
    available: Runtypes.Boolean
}).And(
    Runtypes.Partial({
        pageMeta: Meta,
        thumbnail: Image,
        images: Runtypes.Array(Image),
        description: Text,
        variationCategories: Runtypes.Array(VariationCategory),
        variants: Runtypes.Array(Variant)
    })
)

export const Products = Runtypes.Dictionary(Product, ProductID)

export const ProductUIData = Runtypes.Record({
    breadcrumbs: Runtypes.Array(Link),
    itemQuantity: Runtypes.Number
})
