/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'

import SearchSuggestionsInner from './search-suggestions-inner'

const TakeoverSuggestions = ({
    clickSuggestion,
    onClickSuggestion,
    productSuggestions,
    searchSuggestionClasses,
    suggestedProductsHeading,
    suggestedTermHeading,
    termSuggestions
}) => {
    return (
        <section className={searchSuggestionClasses}>
            <SearchSuggestionsInner
                clickSuggestion={clickSuggestion}
                onClickSuggestion={onClickSuggestion}
                productSuggestions={productSuggestions}
                suggestedProductsHeading={suggestedProductsHeading}
                suggestedTermHeading={suggestedTermHeading}
                termSuggestions={termSuggestions}
            />
        </section>
    )
}

TakeoverSuggestions.propTypes = {
    clickSuggestion: PropTypes.func,
    productSuggestions: PropTypes.array,
    searchSuggestionClasses: PropTypes.string,
    suggestedProductsHeading: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    suggestedTermHeading: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    termSuggestions: PropTypes.array,
    onClickSuggestion: PropTypes.func
}

export default TakeoverSuggestions
