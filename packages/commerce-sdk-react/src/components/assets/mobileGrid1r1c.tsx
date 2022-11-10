/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'; // we need this to make JSX compile

type MobileGrid1r1cProps = {
    children: React.ReactNode
}


const MobileGrid1r1c = ({children}: MobileGrid1r1cProps) => 
    <div className="mobile-1r-1c">
        <div className="row mx-n2">
            <div className="row mx-n2">
                {children}
            </div>
        </div>
    </div>

export default MobileGrid1r1c