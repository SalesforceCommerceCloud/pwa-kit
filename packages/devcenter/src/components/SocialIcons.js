import styled from '@emotion/styled'
import {graphql, useStaticQuery} from 'gatsby'
import React from 'react'
import Github from './icons/Github'
import Icon from './icons/Icon'
import Twitter from './icons/Twitter'

const socialQuery = graphql`
    {
        allSite {
            edges {
                node {
                    siteMetadata {
                        social {
                            name
                            url
                        }
                    }
                }
            }
        }
    }
`

const icons = {
    twitter: <Twitter />,
    github: <Github />
}

const SocialIcons = () => {
    const result = useStaticQuery(socialQuery)
    const socialOptions = result.allSite.edges[0].node.siteMetadata.social
    return (
        <StyledSocialIcons>
            {socialOptions.map((option) => (
                <SocialLinks key={option.name} href={option.url}>
                    <Icon icon={icons[option.name]} size={22} />
                </SocialLinks>
            ))}
        </StyledSocialIcons>
    )
}

const StyledSocialIcons = styled.div`
    display: flex;
    align-items: center;
    margin-right: ${(p) => p.theme.space.xxl};
    opacity: 0.7;
`

const SocialLinks = styled.a`
    display: inline-block;
    margin: 0 ${(p) => p.theme.space.sm};
`

export default SocialIcons
