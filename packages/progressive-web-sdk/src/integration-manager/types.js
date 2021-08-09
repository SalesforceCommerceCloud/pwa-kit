/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import * as Runtypes from 'runtypes'

export const Nullable = (type) => Runtypes.Union(type, Runtypes.Null, Runtypes.Undefined)
export const Integer = Runtypes.Number.withConstraint((n) => Number.isInteger(n))

export const URL = Runtypes.String
export const Measure = Runtypes.String

// SEO Meta Data
export const Meta = Runtypes.Record({
    title: Runtypes.String,
    description: Runtypes.String
}).And(
    Runtypes.Partial({
        keywords: Runtypes.String
    })
)

// A monetary value, notionally with an amount.
export const Money = Runtypes.String

// Text for the user
export const Text = Runtypes.String
// Identifiers for the program
export const Identifier = Runtypes.String

export const ProductID = Identifier
export const CategoryID = Identifier

export const ImageSize = Runtypes.Record({
    height: Measure,
    width: Measure
})

export const Image = Runtypes.Record({
    alt: Text,
    src: URL
}).And(
    Runtypes.Partial({
        zoomSrc: URL,
        thumbnailSrc: URL,
        caption: Nullable(Text), // eslint-disable-line new-cap
        size: ImageSize,
        isMain: Runtypes.Boolean
    })
)
