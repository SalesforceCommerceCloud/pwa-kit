/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// This is test data that is shared between suites.
import React from 'react'
import {Route, IndexRoute} from 'react-router'

export const EXAMPLE_ROUTE = (
    <Route path="/">
        <IndexRoute />
        <Route className="some-class-name" path="test" />
        <Route path="testdir">
            <Route path="true" />
            <Route path="*" />
        </Route>
        <Route path="**" />
    </Route>
)

export const EXAMPLE_ROUTE_SRC = `
    <Route path="/">
        <IndexRoute />
        <Route className="some-class-name" path="test" />
        <Route path="testdir">
            <Route path="true" />
            <Route path="*" />
        </Route>
        <Route path="**" />
    </Route>
`

export const EXAMPLE_ROUTE_REGEX = [
    /^\/\/?$/,
    /^\/test\/?$/,
    /^\/testdir\/?$/,
    /^\/testdir\/true\/?$/,
    /^\/testdir\/.*?\/?$/,
    /^\/.*\/?$/
]
