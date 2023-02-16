/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Component} from '../component'

/**
 * This component will render a page designer region given its serialized data object.
 *
 * @param {RegionProps} props
 * @param {Region} props.region - The page designer region data representation.
 * @returns {React.ReactElement} - Region component.
 */
export const Region = (props) => {
    const {region, className = '', ...rest} = props
    const {id, components} = region

    return (
        <div id={id} className={`region ${className}`} {...rest}>
            <div className="container">
                {components?.map((component) => (
                    <Component key={component.id} component={component} />
                ))}
            </div>
        </div>
    )
}

Region.displayName = 'Region'

Region.propTypes = {
    region: PropTypes.object.isRequired
}

export default Region