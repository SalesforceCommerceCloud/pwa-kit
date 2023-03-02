/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'

ProductsFilter.propTypes = {
    facets: PropTypes.array.isRequired,
    onFilterClick: PropTypes.func.isRequired,
    selectedFacet: PropTypes.array
}

function ProductsFilter(props) {
    const {facets, onFilterClick, selectedFacet = []} = props
    return (
        <div>
            {facets.length === 0 && <div>No filter available. Try Category Test</div>}
            {facets.map((facet) => {
                return (
                    <div>
                        <h3>{facet.displayName}</h3>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start'
                            }}
                        >
                            {facet.values.map((val) => {
                                const isSelected = selectedFacet.find((facet) =>
                                    facet.values.find((value) => value === val.nameOrId)
                                )
                                return (
                                    <button
                                        key={val.nameOrId}
                                        style={{
                                            border: isSelected ? '1px solid red' : 'none',
                                            background: 'none',
                                            padding: '2px',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => onFilterClick(val, facet)}
                                    >
                                        {val.nameOrId}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default ProductsFilter
