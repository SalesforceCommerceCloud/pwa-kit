/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'; // we need this to make JSX compile

type ImageSrc = {
    tablet: string,
    desktop: string,
    mobile: string
}

type Image = {
    src: ImageSrc,
    name: string,
    path: string
}

type ImageAndTextProps = {
    image: Image,
    alt: string,
    heading: string,
    link: string,
    text: string
}


const ImageAndText = ({image, alt, heading, link, text}: ImageAndTextProps) => 
    <div className="ITC-container">
        <div className="row ITC-row">
            <div className="col-12">
                <figure className="ITC-figure image-component">
                    <picture>
                        <a href={link}>
                            <img
                                className="ITC-image image-fluid common-image-component ${pdict.heading ? 'common-image-filter' : ''}"
                                src={`https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_015/on/demandware.static/-/Library-Sites-RefArchSharedLibrary/default/dwe4338f66/${image.path}`}
                                alt={alt ? alt : image.name} title={alt ? alt : image.name}
                            />
                        </a>
                    </picture>
                    <figcaption>
                        <div className="image-heading-container common-image-height">
                            <div className="row ITC-image-heading-text">
                                <div className="col-12 text-sm-left text-center" dangerouslySetInnerHTML={{__html: heading || ''}}>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 ITC-text-underneath" dangerouslySetInnerHTML={{__html: text || ''}}>
                        </div>
                    </figcaption>
                </figure>
            </div>
        </div>
    </div>

export default ImageAndText