/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment} from 'react'
import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'

const Sample = () => {
    const assetUrl = getAssetUrl('/static/@salesforce/extension-sample/salesforce-logo.svg', {extensionName: 'sample'})
    // const logoUrl = getStaticAsset('sample/salesforce-logo.svg')
    // const logoUrl = getStaticAsset('salesforce-logo.svg', {extensionName: 'sample'})
    return (
        <Fragment>
            <h1>Welcome to the Sample Page 👋</h1>
            <hr/>
            <img src={assetUrl} />

            <p>If you are reading this, it means that this page was successfully added to your base project. 🎉</p>
            <p>
                This <i>Application Extension</i> was installed by running the below command in your PWA-Kit project. 
                Its dependancies were automatically installed and the extension configured into your projects extensions array.
            </p>
            <div style={{border: '1px solid darkGray', backgroundColor: 'lightgray', width: 'calc(100% - 10px)', padding: '5px'}}>
                <code>
                    &gt; npm install @salesforce/extension-sample --legacy-peer-deps*<br/>
                    &gt; Downloading npm package... <br/>
                    &gt; Installing extention... <br/>
                    &gt; Finished. <br/>
                    &gt; Congratulations! The Sample extension was successfully installed! Please visit https://www.npmjs.com/package/@salesforce/extension-sample for more information on how to use this extension.
                </code>
            </div>
        </Fragment>
    )
}

Sample.getTemplateName = () => 'sample'

export default Sample