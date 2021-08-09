import React, {useState} from 'react'
import Layout from '../components/Layout'
import {Link} from 'gatsby'
import styled from '@emotion/styled'

const PageNotFound = () => {
    return (
        <PageNotFoundWrapper>
            <Layout
                className="pageNotFound__site-content"
                showLeftSidebar={false}
                column={1}
                isWhiteFooter={true}
            >
                <ContentWrapper>
                    <PageTitle>
                        <div>The page you're looking for</div>
                        <div>can't be found</div>
                    </PageTitle>
                    <BackButton to={'/'}>Go to home page</BackButton>
                </ContentWrapper>
            </Layout>
        </PageNotFoundWrapper>
    )
}

const PageTitle = styled.h1`
    text-align: center;
    :after {
        display: none;
    }
`
const BackButton = styled(Link)`
    background: ${(p) => p.theme.colors.brightBlue};
    box-shadow: ${(p) => p.theme.shadows.primaryButton};
    color: ${(p) => p.theme.colors.white};
    padding: ${(p) => p.theme.space.mid} ${(p) => p.theme.space.xl};
    text-decoration: none;
    border-radius: ${(p) => p.theme.radii.sm};
    font-weight: ${(p) => p.theme.fontWeights.medium};
    border: 1px solid transparent;

    &:hover {
        background: ${(p) => p.theme.colors.darkBlue};
    }

    &:active {
        background: ${(p) => p.theme.colors.white};
        border-color: ${(p) => p.theme.colors.brightBlue};
        color: ${(p) => p.theme.colors.brightBlue};
    }
`
const PageNotFoundWrapper = styled.div`
    .layout__site-content-wrapper {
        padding: ${(p) => p.theme.space.xl};
    }

    .pageNotFound__site-content {
        padding: 0;
    }

    ${PageTitle} {
        font-size: ${(p) => p.theme.fontSizes.pageTitleLg};
        font-weight: ${(p) => p.theme.fontWeights.medium};
        margin-bottom: ${(p) => p.theme.space.exlg};
    }
`

const ContentWrapper = styled.div`
    height: 60vh;
    background: linear-gradient(
        135deg,
        ${(p) => p.theme.colors.lightRed} 0%,
        ${(p) => p.theme.colors.lightPurple} 100%
    );

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`
PageNotFound.propTypes = {}

export default PageNotFound
