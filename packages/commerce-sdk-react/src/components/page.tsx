/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'; // we need this to make JSX compile
import Region from './region'

// TODO: You can bring in the type from the response value of the getPage method
// in commerce-sdk-iosomorphic once it's done.
type PageProps = {
    id: string,
    typeId: string,
    aspectTypeId: string,
    name: string,
    description: string,
    pageTitle: string,
    pageDescription: string,
    pageKeywords: string,
    data: object,
    custom: object,
    regions: Array<any>,
    componentMap: any
}

export const Page = ({pageTitle, pageDescription, pageKeywords, regions = [], componentMap = {}}: PageProps) => 
    <div>
        <h2>{pageTitle}</h2>
        <meta name="keywords" content={pageKeywords} />
        <p>
            {pageDescription}
        </p>
        <div>
            {regions.map((region) => <Region {...region} componentMap={componentMap} />)}
        </div>
    </div>
