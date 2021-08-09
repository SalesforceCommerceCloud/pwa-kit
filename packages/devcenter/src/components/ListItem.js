import React from 'react'
import styled from '@emotion/styled'
import PropTypes from 'prop-types'

const ListItem = ({item, className}) => {
    return (
        <ListItemLink href={item.url} className={className}>
            {item.title}
        </ListItemLink>
    )
}

const ListItemLink = styled.a`
    color: ${(p) => p.theme.colors.text};
    display: inline-block;
    padding: 0;
    width: fit-content;
    text-decoration: none;
    transition: color ${(p) => p.theme.transition};
    &.is-active,
    :active,
    :focus {
        color: ${(p) => p.theme.colors.brightBlue};
        text-decoration: underline;
        background-color: ${(p) => p.theme.colors.mediumSilver};
        outline: none;
    }
    :hover {
        color: ${(p) => p.theme.colors.brightBlue};
        text-decoration: underline;
    }
`

ListItem.propTypes = {
    location: PropTypes.object.isRequired,
    item: PropTypes.object.isRequired,
    className: PropTypes.string
}

export default ListItem
