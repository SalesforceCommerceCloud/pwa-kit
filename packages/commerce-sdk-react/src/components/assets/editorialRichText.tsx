/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'; // we need this to make JSX compile

type EditorialRichTextProps = {
    richText: string
}

const EditorialRichText = ({richText}: EditorialRichTextProps) => 
    <div className="editorialRichText-component-container">
        <div className="row">
            <div className="col-12 align-self-center text-center text-lg-left" dangerouslySetInnerHTML={{__html: richText}}>
                
            </div>
        </div>
    </div>

export default EditorialRichText