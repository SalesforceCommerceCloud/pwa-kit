import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {withRouter} from 'react-router-dom'

import {Desktop, TabletOrSmaller, Mobile} from '../../components/media-queries'

import Button from 'progressive-web-sdk/dist/components/button'
import {
    HeaderBar,
    HeaderBarActions,
    HeaderBarTitle
} from 'progressive-web-sdk/dist/components/header-bar'
import IconLabel from 'progressive-web-sdk/dist/components/icon-label'
import MegaMenu from 'progressive-web-sdk/dist/components/mega-menu'
import Nav from 'progressive-web-sdk/dist/components/nav/'
import NavHeader from 'progressive-web-sdk/dist/components/nav-header/'
import NavMenu from 'progressive-web-sdk/dist/components/nav-menu/'
import Sheet from 'progressive-web-sdk/dist/components/sheet'

export const MobileHeader = (props) => {
    const {
        openNavigation,
        closeNavigation,
        navigationRoot,
        path,
        onPathChange,
        navigationIsOpen,
        errorHeader
    } = props

    return (
        <HeaderBar className="c-header">
            {!errorHeader && (
                <HeaderBarActions>
                    {navigationIsOpen ? (
                        <Button className="pw--black" onClick={closeNavigation}>
                            <IconLabel label={'Close'} iconName={'close'} iconSize="medium" />
                        </Button>
                    ) : (
                        <Button
                            className="pw--black"
                            onClick={openNavigation}
                            data-analytics-name="Menu"
                            data-analytics-content="Open"
                        >
                            <IconLabel label={'Menu'} iconName={'menu'} iconSize="medium" />
                        </Button>
                    )}

                    <Sheet
                        open={navigationIsOpen}
                        onDismiss={closeNavigation}
                        className="c-header__sheet"
                    >
                        <Nav
                            className="c-header__navigation"
                            root={navigationRoot}
                            path={path}
                            onPathChange={onPathChange}
                        >
                            <NavHeader
                                className="c-header__nav-modal"
                                onClose={closeNavigation}
                                startContent={
                                    <Button
                                        className={path === '/' ? 'u-visually-hidden' : ''}
                                        data-analytics-name="Menu"
                                        data-analytics-content="Back"
                                    >
                                        <IconLabel
                                            label={'Back'}
                                            iconName={'chevron-left'}
                                            iconSize="medium"
                                        />
                                    </Button>
                                }
                                endContent={
                                    <div>
                                        <Mobile>
                                            <Button
                                                data-analytics-name="Menu"
                                                data-analytics-content="Close"
                                            >
                                                <IconLabel
                                                    label={'Close'}
                                                    iconName={'close'}
                                                    iconSize="medium"
                                                />
                                            </Button>
                                        </Mobile>
                                    </div>
                                }
                            />
                            <NavMenu />
                        </Nav>
                    </Sheet>
                </HeaderBarActions>
            )}

            <HeaderBarTitle className="c-header__title">
                <a href="/">
                    <img
                        src="https://www.mobify.com/wp-content/uploads/logo-mobify-white.png"
                        alt="Mobify Logo"
                        height="35"
                    />
                </a>
            </HeaderBarTitle>
        </HeaderBar>
    )
}

MobileHeader.propTypes = {
    closeNavigation: PropTypes.func,
    errorHeader: PropTypes.bool,
    navigationIsOpen: PropTypes.bool,
    navigationRoot: PropTypes.object,
    openNavigation: PropTypes.func,
    path: PropTypes.string,
    onPathChange: PropTypes.func
}

export const DesktopHeader = (props) => {
    const {navigationRoot, path, onPathChange, errorHeader} = props

    return (
        <div>
            <HeaderBar className="c-header">
                <div className="c-header__content">
                    <HeaderBarTitle className="u-flexbox" href="/">
                        <img
                            className="c-header__logo"
                            src="https://www.mobify.com/wp-content/uploads/logo-mobify-white.png"
                            alt="Mobify Logo"
                            height="50"
                        />
                    </HeaderBarTitle>
                </div>
            </HeaderBar>

            {!errorHeader && (
                <Nav
                    className="c-header__navigation"
                    root={navigationRoot}
                    path={path}
                    onPathChange={onPathChange}
                >
                    <MegaMenu className="c-header__navigation-megamenu" />
                </Nav>
            )}
        </div>
    )
}

DesktopHeader.propTypes = {
    errorHeader: PropTypes.bool,
    navigationIsOpen: PropTypes.bool,
    navigationRoot: PropTypes.object,
    path: PropTypes.string,
    onPathChange: PropTypes.func
}

class Header extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            navigationIsOpen: false,
            path: '/'
        }
    }

    openNavigation() {
        this.setState({
            navigationIsOpen: true,
            path: '/'
        })
    }

    closeNavigation() {
        this.setState({
            navigationIsOpen: false,
            path: '/'
        })
    }

    onPathChange(path, isLeaf, trigger, originalPath) {
        if (trigger === 'click' && isLeaf) {
            const {history} = this.props
            history.push(originalPath)
            this.setState({navigationIsOpen: false, path: '/'})
        } else {
            this.setState({path: originalPath})
        }
    }

    render() {
        const {navigationRootMobile, navigationRootDesktop} = this.props
        const childProps = {
            openNavigation: this.openNavigation.bind(this),
            closeNavigation: this.closeNavigation.bind(this),
            path: this.state.path,
            navigationIsOpen: this.state.navigationIsOpen,
            onPathChange: this.onPathChange.bind(this)
        }

        return (
            <Fragment>
                <TabletOrSmaller>
                    <MobileHeader {...childProps} navigationRoot={navigationRootMobile} />
                </TabletOrSmaller>
                <Desktop>
                    <DesktopHeader {...childProps} navigationRoot={navigationRootDesktop} />
                </Desktop>
            </Fragment>
        )
    }
}

Header.propTypes = {
    history: PropTypes.object,
    navigationRootDesktop: PropTypes.object,
    navigationRootMobile: PropTypes.object
}

export {Header as UnconnectedHeader}
export default withRouter(Header)
