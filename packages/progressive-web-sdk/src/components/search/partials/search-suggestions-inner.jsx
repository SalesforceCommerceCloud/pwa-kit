/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'

import ListTile from '../../list-tile'
import Tile from '../../tile'

const SearchSuggestionsInner = ({
    clickSuggestion,
    onClickSuggestion,
    productSuggestions,
    suggestedProductsHeading,
    suggestedTermHeading,
    termSuggestions
}) => {
    return (
        /*
         * Adding tabIndex to prevent focus from accidentally escaping. For
         * example, when clicking inside things in the suggestion list that
         * don't have click handlers.
         */
        <div tabIndex="0">
            {termSuggestions && (
                <div className="pw-search__term-suggestions">
                    <span className="pw-search__suggestion-heading">{suggestedTermHeading}</span>

                    <ul className="pw-search__suggestion-list">
                        {termSuggestions.map((suggestion, index) => {
                            const suggestionProps = {
                                ...suggestion
                            }
                            if (onClickSuggestion) {
                                suggestionProps.onClick = clickSuggestion
                            }
                            return (
                                <li key={index} className="pw-search__suggestion">
                                    <ListTile {...suggestionProps} />
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}

            {productSuggestions && (
                <div className="pw-search__product-suggestions">
                    <span className="pw-search__suggestion-heading">
                        {suggestedProductsHeading}
                    </span>

                    <ul className="pw-search__suggestion-list">
                        {productSuggestions.map((suggestion, index) => {
                            const suggestionProps = {
                                ...suggestion
                            }
                            if (onClickSuggestion) {
                                suggestionProps.onClick = clickSuggestion
                            }
                            return (
                                <li key={index} className="pw-search__suggestion">
                                    <Tile {...suggestionProps} />
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </div>
    )
}

SearchSuggestionsInner.propTypes = {
    clickSuggestion: PropTypes.func,
    productSuggestions: PropTypes.array,
    suggestedProductsHeading: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    suggestedTermHeading: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    termSuggestions: PropTypes.array,
    onClickSuggestion: PropTypes.func
}

export default SearchSuggestionsInner
