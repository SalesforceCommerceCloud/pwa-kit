/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'; // we need this to make JSX compile

type MobileGrid3r1cProps = {
    children: React.ReactNode
}


const MobileGrid3r1c = ({children}: MobileGrid3r1cProps) => 
    <div className="mobile-3r-1c">
        <div className="row mx-n2">
            <div className="region col-12 col-sm-4">{React.Children.toArray(children)[0]}</div>
            <div className="region col-12 col-sm-4">{React.Children.toArray(children)[1]}</div>
            <div className="region col-12 col-sm-4">{React.Children.toArray(children)[2]}</div>
        </div>
    </div>

export default MobileGrid3r1c