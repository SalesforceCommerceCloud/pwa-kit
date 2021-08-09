import React from 'react'
import PropTypes from 'prop-types'
import SearchIconWhite from '../../images/search_white.svg'
import SearchIconFocus from '../../images/search_focus.svg'
import styled from '@emotion/styled'

SearchIcon.propTypes = {
    focus: PropTypes.bool.isRequired,
    className: PropTypes.string
}

function SearchIcon({focus = false, className = ''}) {
    return (
        <SearchIconWrapper className={className}>
            {focus ? (
                <img src={SearchIconFocus} alt="search_icon_focus" />
            ) : (
                <img src={SearchIconWhite} alt="search_icon_focus" />
            )}
        </SearchIconWrapper>
    )
}

const SearchIconWrapper = styled.div`
    pointer-events: none;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: ${(p) => p.theme.space.md}; // 16px
`

export default SearchIcon
