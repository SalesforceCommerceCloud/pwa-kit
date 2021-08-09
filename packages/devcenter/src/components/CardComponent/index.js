import React, {useContext} from 'react'
import PropTypes from 'prop-types'
import mediaqueries from '../../styles/media'
import {Link} from 'gatsby'
import {navigate} from 'gatsby'
import styled from '@emotion/styled'
import file from '../../images/file.svg'
import externalLink from '../../images/external-link.svg'
import {GlobalDispatchContext} from '../../context/GlobalContextProvider'
import {Styled} from 'theme-ui'

const CardContent = styled.div`
    background-color:  ${(p) => p.theme.colors.white};
    height: calc(100%);
    border: ${(p) => p.theme.borderWidths.thinnest} solid ${(p) => p.theme.colors.mediumSilver};
    border-radius: ${(p) => p.theme.radii.sm};
    padding: ${(p) => p.theme.space.lg};
    box-shadow: ${(p) => p.theme.shadows.lighter};
    transition: box-shadow ${(p) => p.theme.transition} ease;
    
    &.card_link:hover {
        box-shadow: ${(p) => p.theme.shadows.medium};
        cursor: pointer;
    }
    &.card_link:hover h3 {
        color: ${(p) => p.theme.colors.brightBlue};
    }
    &.card_link:active,
    &.card_link:focus {
        background-color: ${(p) => p.theme.colors.mediumSilver};
        box-shadow: ${(p) => p.theme.shadows.cardActive};
        outline: none;
    }

    .card_content {
        display: block;
        overflow: hidden;
        margin-top: 0;
        margin-left: ${(p) => p.theme.space.sm};
        ${mediaqueries.tablet_up`
            margin-left: 0;
            margin-top: 12px;
        `};
    }

    h3.card_title {
        margin-top: 0;
        border-top: 0;
        padding-top: 0;
        margin-bottom: ${(p) => p.theme.space.mid};
    }

    .card_label {
        font-weight: ${(p) => p.theme.fontWeights.bolder};
        color: ${(p) => p.theme.colors.gray};
        font-size: ${(p) => p.theme.fontSizes.sm};
        margin-top: 0;
        margin-bottom: 0;
    }

    h4.card_altTitle {
        color: ${(p) => p.theme.colors.brightBlue};
        border-top: 0;
        margin-top: ${(p) => p.theme.space.sm};
        margin-bottom: ${(p) => p.theme.space.sm};
        padding-top: 0;
        
        ${(p) => mediaqueries.tablet`
            font-size: ${p.theme.fontSizes.lg}
        `};
    }

    p.card_description {
        margin-top: ${(p) => p.theme.space.xs};
        margin-bottom: ${(p) => p.theme.space.xs};
        font-size: ${(p) => p.theme.fontSizes.md};

    }

    span.link_group {
        font-size: ${(p) => p.theme.fontSizes.xs};
        color: ${(p) => p.theme.colors.gray};
        font-weight: ${(p) => p.theme.fontWeights.bolder};
        padding-top ${(p) => p.theme.space.md};
        padding-bottom: ${(p) => p.theme.space.xs};
        display: block
    }

    ul {
        padding: ${(p) => p.theme.space.xs};
        margin-top: ${(p) => p.theme.space.zero};
    }

    li {
        list-style-type: none;
        padding: ${(p) => p.theme.space.xxs};
    }

    a {
        color: ${(p) => p.theme.colors.brightBlue};
        
        :focus, :active {
            background-color: ${(p) => p.theme.colors.mediumSilver};
        }

        :hover {
            text-decoration: none;
        }

    }

    img.card_icon {
        position: relative;
        top: ${(p) => p.theme.space.xxs};
        width: ${(p) => p.theme.fontSizes.md};
        height: ${(p) => p.theme.fontSizes.md};
    }

    img[alt="externalLink"] {
        margin-left: ${(p) => p.theme.space.sm};
    }

    img[alt="file"] {
        margin-right: ${(p) => p.theme.space.sm};
    }

    div.card_img {
        ${mediaqueries.tablet_up`
            float: left;
        `};
    }

    div.card_img img {
        margin-right: ${(p) => p.theme.space.xl};
    }
`

const StyledCardWrapper = styled.div`
    outline: none;
`

export const Card = ({
    icon,
    label,
    cardLink,
    isCardLinkExternal = false,
    altTitle,
    title,
    description,
    linkGroups
}) => {
    const dispatch = useContext(GlobalDispatchContext)
    if (linkGroups) {
        // sort the link alphabetically
        linkGroups.sort((a, b) => {
            if (a.title < b.title) return -1
            if (a.title > b.title) return 1
            return 0
        })
    }
    return (
        <StyledCardWrapper
            tabIndex="0"
            onClick={() => {
                if (typeof cardLink !== 'undefined') {
                    if (isCardLinkExternal && window && window.location) {
                        window.location = cardLink
                    } else {
                        const group = cardLink.slice(0, cardLink.lastIndexOf('/'))
                        navigate(cardLink)
                        dispatch({
                            type: 'TOGGLE_NAV_COLLAPSED',
                            group
                        })
                    }
                }
            }}
        >
            <CardContent className={cardLink ? 'card_link' : null}>
                {icon && (
                    <div className="card_img">
                        <img src={icon} alt="cardImage" />
                    </div>
                )}
                <div className={icon ? 'card_content' : 'card'}>
                    {label && <p className="card_label">{label}</p>}
                    {altTitle && (
                        <Styled.h4 className="card_altTitle">
                            {altTitle}
                            {isCardLinkExternal && (
                                <img className="card_icon" src={externalLink} alt="externalLink" />
                            )}
                        </Styled.h4>
                    )}
                    {title && <Styled.h3 className="card_title">{title}</Styled.h3>}
                    {description && <p className="card_description">{description}</p>}
                    {linkGroups && (
                        <ul className="links">
                            {linkGroups.map(({title, slug}) => {
                                return (
                                    <div key={slug}>
                                        <li key={title}>
                                            <img className="card_icon" src={file} alt="file" />
                                            <Link to={slug}>{title}</Link>
                                        </li>
                                    </div>
                                )
                            })}
                        </ul>
                    )}
                </div>
            </CardContent>
        </StyledCardWrapper>
    )
}

Card.propTypes = {
    /**
     * The filepath for the card icon.
     */
    icon: PropTypes.string,

    /**
     * Text at the top right corner of card.
     */

    label: PropTypes.string,

    /**
     * Main card title
     */
    title: PropTypes.string,

    /**
     * Alternate smaller title
     */
    altTitle: PropTypes.string,

    /**
     * Card description.
     */
    description: PropTypes.string,

    /**
     * Links to other pages to list on the card.
     */
    linkGroups: PropTypes.array,

    /**
     * The link for a clickable card to navigate to.
     */
    cardLink: PropTypes.string,

    /**
     * Flag to indicate if cardlink is an external link (default: false)
     */
    isCardLinkExternal: PropTypes.bool
}
