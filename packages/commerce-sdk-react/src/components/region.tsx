/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'; // we need this to make JSX compile
import Component from './component'

// TODO: You can bring in the type from the response value of the getPage method
// in commerce-sdk-iosomorphic once it's done.
type RegionProps = {
    id: string,
    components: Array<any>,
    componentMap: any
}

const Region = ({id, components = [], componentMap}: RegionProps) => 
    <div id={id}>
        {components.map((component) => <Component {...component} componentMap={componentMap} />)}
    </div>

export default Region

