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

type MainBannerProps = {
    image: Image,
    alt: string,
    heading: string,
    link: string,
    text: string
}


const MainBanner = ({image, alt, heading}: MainBannerProps) => 
    <div className="mainbanner-container">
        <a href="${pdict.categoryLink}">
            <div className="row">
                <div className="col-12">
                    <figure className="mainbanner-figure image-component">
                        <picture>
                            <img
                                className="mainbanner-image image-fluid common-image-component common-image-filter"
                                src={`https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_015/on/demandware.static/-/Library-Sites-RefArchSharedLibrary/default/dwe4338f66/${image.path}`}
                                alt={alt}
                            />
                        </picture>
                        <figcaption className="image-heading-container">
                            <div className="row image-heading-text">
                                <div className="col-12 text-sm-left text-center">
                                    <span dangerouslySetInnerHTML={{__html: heading}}>
                                    </span>
                                </div>
                            </div>
                            <div className="row mainbanner-sub-text">
                                <div className="col-12 text-sm-left text-center">
                                    <p className="link-large">Shop Now</p>
                                </div>
                            </div>
                        </figcaption>
                    </figure>
                </div>
            </div>
        </a>
    </div>

export default MainBanner