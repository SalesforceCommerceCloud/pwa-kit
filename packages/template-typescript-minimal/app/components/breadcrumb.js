/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {Link} from 'react-router-dom'
import React from 'react'

const Breadcrumb = ({categories}) => {
    if (!categories) return null
    return (
        <div>
            {categories.path.map((cate, i) => {
                return (
                    <span style={{marginRight: '10px'}} key={cate.id}>
                        <Link to={`/category/${cate.id}/${cate.name}`}>{cate.name}</Link>
                        {i !== categories.path.length - 1 && <span> / </span>}
                    </span>
                )
            })}
        </div>
    )
}

export default Breadcrumb
