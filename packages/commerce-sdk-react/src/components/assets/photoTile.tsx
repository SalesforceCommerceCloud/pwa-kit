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
    path: string,
}

type PhotoTileProps = {
    image: Image,
    alt: string,
    heading: string,
    link: string,
    text: string,
    path: string
}

const PhotoTile = ({alt, image}: PhotoTileProps) => 
    <div className="photo-tile-container">
        <div className="row">
            <div className="col-12">
                <figure className="photo-tile-figure">
                    <picture>
                        <img
                            className="photo-tile-image image-fluid"
                            src={`https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_015/on/demandware.static/-/Library-Sites-RefArchSharedLibrary/default/dwe4338f66/${image.path}`}
                            alt={alt}
                            title={alt}
                        />
                    </picture>
                </figure>
            </div>
        </div>
    </div>


export default PhotoTile