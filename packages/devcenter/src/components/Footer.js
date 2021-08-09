import React from 'react'
import styled from '@emotion/styled'
import {Link} from 'gatsby'
import Logo from '../images/mobify-logo.svg'
import {TabletOrSmaller, Default} from '../hooks/useMedia'
import mediaqueries from '../styles/media'

const year = new Date().getFullYear()
const Footer = ({isWhiteFooter}) => (
    <>
        <Default>
            <FooterWrapper isWhiteFooter={isWhiteFooter}>
                <FooterContent>
                    <Menu>
                        <h5>
                            <img src={Logo} alt="Mobify logo" />
                        </h5>
                        <StyledCopyright>
                            <div>Copyright &copy; {year}.</div>
                            <div>All rights reserved.</div>
                        </StyledCopyright>
                    </Menu>
                    <Menu>
                        <h5>Company</h5>
                        <div>
                            <Anchor href="https://www.mobify.com/about/">About</Anchor>
                        </div>
                        <div>
                            <Anchor href="https://www.mobify.com/insights/">Blog</Anchor>
                        </div>
                        <div>
                            <Anchor href="https://www.mobify.com/customers/">Case Studies</Anchor>
                        </div>
                        <div>
                            <Anchor href="https://www.mobify.com/terms-of-use/">Term of Use</Anchor>
                        </div>
                        <div>
                            <Anchor href="https://www.mobify.com/privacy/">Privacy Policy</Anchor>
                        </div>
                    </Menu>
                    <Menu>
                        <h5>DevCenter</h5>
                        <div>
                            <StyledLink to="/get-started">Get Started</StyledLink>
                        </div>
                        <div>
                            <StyledLink to="/how-to-guides">How-To Guides</StyledLink>
                        </div>
                        <div>
                            <StyledLink to="/apis-and-sdks">APIs &amp; SDKs</StyledLink>
                        </div>
                    </Menu>
                    <Menu>
                        <h5>Support</h5>
                        <div>
                            <Anchor
                                href="https://support.mobify.com/support/tickets/new"
                                target="_blank"
                                rel="noopener"
                            >
                                Create a Ticket
                            </Anchor>
                        </div>
                        <div>
                            <Anchor
                                href="https://support.mobify.com/support/login"
                                target="_blank"
                                rel="noopener"
                            >
                                Login
                            </Anchor>
                        </div>
                    </Menu>
                    <Menu>
                        <h5>Mobify Cloud</h5>
                        <div>
                            <Anchor href="https://cloud.mobify.com" target="_blank" rel="noopener">
                                Login
                            </Anchor>
                        </div>
                    </Menu>
                </FooterContent>
            </FooterWrapper>
        </Default>
        <TabletOrSmaller>
            <FooterWrapper isMobile={true} isWhiteFooter={isWhiteFooter}>
                <FooterContent isMobile={true}>
                    <img src={Logo} alt="Mobify logo" height="20" />
                    <Menu isMobile={true}>
                        <Anchor href="https://www.mobify.com/contact/">Contact</Anchor>
                        <Anchor href="https://www.mobify.com/terms-of-use/">Term of Use</Anchor>
                        <Anchor href="https://www.mobify.com/privacy/">Privacy Policy</Anchor>
                    </Menu>
                    <StyledCopyright>
                        <span>&copy; {year}. </span>
                        <span>All rights reserved.</span>
                    </StyledCopyright>
                </FooterContent>
            </FooterWrapper>
        </TabletOrSmaller>
    </>
)

const FooterWrapper = styled.footer`
    display: flex;
    width: 100%;
    justify-content: center;
    background-color: ${(p) =>
        p.isWhiteFooter ? p.theme.colors.white : p.theme.colors.lightSilver};
    padding: ${(p) => (p.isMobile ? `${p.theme.space.xl}` : `${p.theme.space.exlg}`)};
    margin-top: ${(p) => p.theme.space.exlg};

    & h5 {
        margin-top: 0;
        border-top: 0;
        padding-top: 0;
    }

    ${(p) => mediaqueries.desktop_medium_up`
        padding: ${p.theme.space.exlg} ${p.theme.footerPadding};
    `}
`

const FooterContent = styled.div`
    display: flex;
    max-width: ${(p) => p.theme.maxPageWidth};
    margin-left: auto;
    margin-right: auto;
    flex: 1;
    justify-content: space-between;
    align-items: ${(p) => (p.isMobile ? 'center' : 'flex-start')};

    ${mediaqueries.phablet`
        flex-direction: column;
        align-items: flex-start;
    `};
`

const StyledCopyright = styled.div`
    color: ${(p) => p.theme.colors.gray};
`

const Anchor = styled.a`
    text-decoration: none;
    cursor: pointer;
    color: ${(p) => p.theme.colors.gray};
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

    ${(p) => mediaqueries.phablet`
        padding: ${p.theme.space.mid} ${p.theme.space.md};
        padding-left: 0;
    `};
`

const Menu = styled.div`
    display: flex;
    flex-direction: ${(p) => (p.isMobile ? 'row' : 'column')};
    flex: 1;
    padding-left: ${(p) => p.theme.space.sm};
    padding-right: ${(p) => p.theme.space.sm};
    justify-content: ${(p) => (p.isMobile ? 'space-around' : 'flex-start')};

    ${Anchor} {
        font-weight: 500;
        color: ${(p) => p.theme.colors.gray};
    }

    ${(p) => mediaqueries.phablet`
        flex-direction: column;
        align-items: flex-start;
        margin-top: ${p.theme.space.xl};
        margin-bottom: ${p.theme.space.xl};
        padding-left: 0;
    `};
`

const StyledLink = styled(Link)`
    text-decoration: none;
    cursor: pointer;
    color: ${(p) => p.theme.colors.gray};
    font-weight: 500;
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
export default Footer
