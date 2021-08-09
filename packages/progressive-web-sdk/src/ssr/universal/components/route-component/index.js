/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import PropTypes from 'prop-types'
import React from 'react'
import {withRouter} from 'react-router-dom'
import hoistNonReactStatic from 'hoist-non-react-statics'
import {AppErrorContext} from '../../components/app-error-boundary'
import Throw404 from '../../components/throw-404'
import AppConfig from '../../components/_app-config'
import routes from '../../routes'
import {pages as pageEvents} from '../../events'

const noop = () => undefined

const isServerSide = typeof window === 'undefined'
const hasPerformanceAPI = !isServerSide && window.performance && window.performance.timing

/* istanbul ignore next */
const now = () => {
    return hasPerformanceAPI
        ? window.performance.timing.navigationStart + window.performance.now()
        : Date.now()
}

/**
 * @private
 */
const withErrorHandling = (Wrapped) => {
    /* istanbul ignore next */
    const wrappedComponentName = Wrapped.displayName || Wrapped.name

    const WithErrorHandling = (props) => (
        <AppErrorContext.Consumer>
            {(ctx) => <Wrapped {...props} {...ctx} />}
        </AppErrorContext.Consumer>
    )

    // Expose statics from the wrapped component on the HOC
    hoistNonReactStatic(WithErrorHandling, Wrapped)

    WithErrorHandling.displayName = `WithErrorHandling(${wrappedComponentName})`
    return WithErrorHandling
}

/**
 * The `routeComponent` HOC is automatically used on every component in a project's
 * route-config. It provides an interface, via static methods on React components,
 * that can be used to fetch data on the server and on the client, seamlessly.
 */
export const routeComponent = (Wrapped, isPage, locals) => {
    const extraArgs = AppConfig.extraGetPropsArgs(locals)

    /* istanbul ignore next */
    const wrappedComponentName = Wrapped.displayName || Wrapped.name

    class RouteComponent extends React.Component {
        constructor(props, context) {
            super(props, context)
            this.state = {
                childProps: {}
            }
        }

        /**
         * Route-components implement `shouldGetProps()` to control when the
         * component should fetch data from the server by calling `getProps()`.
         * Typically, this is done by looking at the request URL.
         *
         * If not implemented, route-components will call `getProps()` again whenever
         * `location.pathname` changes.
         *
         * The `shouldGetProps` function is called once on the server and every time
         * a component updates on the client.
         *
         * @param {Object} args
         *
         * @param {Location} args.previousLocation - the previous value of
         *   window.location, or a server-side equivalent.
         *
         * @param {Location} args.location - the current value of window.location,
         *   or a server-side equivalent.
         *
         * @param {Object} args.previousParams - the previous parameters that were
         *   parsed from the URL by react-router.
         *
         * @param {Object} args.params - the current parameters that were parsed
         *   from the URL by react-router.
         *
         * @return {Promise<Boolean>}
         */
        static async shouldGetProps(args) {
            const defaultImpl = () => {
                const {previousLocation, location} = args
                return !previousLocation || previousLocation.pathname !== location.pathname
            }
            const component = await RouteComponent.getComponent()

            return component.shouldGetProps ? component.shouldGetProps(args) : defaultImpl()
        }

        /**
         * Route-components implement `getProps()` to fetch the data they need to
         * display. The `getProps` function must return an Object which is later
         * passed to the component as props for rendering. The returned Object is
         * serialzied and embedded into the rendered HTML as the initial app
         * state when running server-side.
         *
         * Throwing or rejecting inside `getProps` will cause the server to return
         * an Error, with an appropriate status code.
         *
         * Note that `req` and `res` are only defined on the server – the only place
         * the code actually has access to Express requests or responses.
         *
         * If not implemented `getProps()` does nothing and the component will not
         * fetch any data.
         *
         * @param {Object} args
         *
         * @param {Request} args.req - an Express HTTP Request object on the server,
         *   undefined on the client.
         *
         * @param {Response} args.res - an Express HTTP Response object on the server,
         *   undefined on the client.
         *
         * @param {Object} args.params - the parameters that were parsed from the URL
         *   by react-router.
         *
         * @param {Location} args.location - the current value of window.location,
         *   or a server-side equivalent.
         *
         * @return {Promise<Object>}
         */
        // eslint-disable-next-line
        static async getProps(args) {
            const component = await RouteComponent.getComponent()
            return component.getProps
                ? component.getProps({...args, ...extraArgs})
                : Promise.resolve()
        }

        /**
         * Get the underlying component this HoC wraps. This handles loading of
         * `@loadable/component` components.
         *
         * @return {Promise<React.Component>}
         */
        static async getComponent() {
            return Wrapped.load
                ? Wrapped.load().then((module) => module.default)
                : Promise.resolve(Wrapped)
        }

        /**
         * Route-components implement `getTemplateName()` to return a readable
         * name for the component that is used internally for analytics-tracking –
         * eg. performance/page-view events.
         *
         * If not implemented defaults to the `displayName` of the React component.
         *
         * @return {Promise<String>}
         */
        static async getTemplateName() {
            return RouteComponent.getComponent().then((c) =>
                c.getTemplateName ? c.getTemplateName() : Promise.resolve(wrappedComponentName)
            )
        }

        /**
         * Route-components implement `getPageType()` to indicate that the page
         * should be rendered as a PWA or an AMP page.
         *
         * The default, if not implemented, is 'pwa'.
         *
         * @return {Promise<String>}
         */
        static async getPageType() {
            return RouteComponent.getComponent().then((c) =>
                c.getPageType ? c.getPageType() : Promise.resolve('pwa')
            )
        }

        componentDidMount() {
            this.componentDidUpdate({})
        }

        componentDidUpdate(previousProps) {
            const {location: previousLocation, match: previousMatch} = previousProps
            const {
                location,
                match,
                onGetPropsComplete,
                onGetPropsError,
                onUpdateComplete
            } = this.props

            const {params} = match || {}
            const {params: previousParams} = previousMatch || {}

            // The isHydrating MUST only be used to decide whether or not to call
            // static lifecycle methods. Do not use it in component rendering - you
            // will not be able to trigger updates, because this is intentionally
            // outside of a component's state/props.
            const isHydrating = !isServerSide && window.__HYDRATING__

            /* istanbul ignore next */
            // Don't getProps() when hydrating - the server has already done
            // getProps() frozen the state in the page.
            const shouldGetPropsNow = () => {
                return (
                    !isHydrating &&
                    RouteComponent.shouldGetProps({
                        previousLocation,
                        location,
                        previousParams,
                        params
                    })
                )
            }

            // Note: We've built a reasonable notion of a "page load time" here:
            //
            // 1. For first loads the load time is the time elapsed between the
            //    user pressing enter in the URL bar and the first pageLoad event
            //    fired by this component.
            //
            // 2. For subsequent loads the load time is the time elapsed while
            //    running the getProps() function.
            //
            // Since the time is overwhelmingly spent fetching data on soft-navs,
            // we think this is a good approximation in both cases.

            return Promise.resolve()
                .then(() => RouteComponent.getTemplateName())
                .then((templateName) => {
                    const start = now()
                    const emitPageLoadEvent = (templateName, end) =>
                        isPage && pageEvents.pageLoad(templateName, start, end)

                    const emitPageErrorEvent = (name, content) =>
                        isPage && pageEvents.error(name, content)

                    // If hydrating, we know that the server just fetched and
                    // rendered for us, embedding the app-state in the page HTML.
                    // For that reason, we don't ever do getProps while Hydrating.
                    // However, we still want to report a page load time for this
                    // initial render. Rather than fetching again, trigger the event
                    // right away and do nothing.

                    if (isHydrating) {
                        emitPageLoadEvent(templateName, now())
                    }

                    return Promise.resolve()
                        .then(shouldGetPropsNow)
                        .then((should) => {
                            // Because `shouldGetPropsNow` is async the app is often
                            // no longer hydrating when you hit this line. That doesn't
                            // matter for initialization. For logging make it clear
                            // that we mean "the app was hydrating on this call to
                            // componentDidUpdate".
                            console.log(
                                JSON.stringify({
                                    templateName,
                                    wasHydratingOnUpdate: isHydrating,
                                    shouldInit: should
                                })
                            )

                            if (should) {
                                return Promise.resolve()
                                    .then(() => {
                                        console.log(`Calling getProps for '${templateName}'`)
                                        const req = undefined
                                        const res = undefined
                                        return RouteComponent.getProps({
                                            req,
                                            res,
                                            params,
                                            location
                                        })
                                    })
                                    .then((childProps) => {
                                        if (childProps) {
                                            return new Promise((resolve) => {
                                                this.setState({childProps}, resolve)
                                            })
                                        }
                                    })
                                    .then(() => {
                                        onGetPropsComplete()
                                        emitPageLoadEvent(templateName, now())
                                    })
                                    .catch((err) => {
                                        onGetPropsError(err)
                                        emitPageErrorEvent(templateName, err)
                                    })
                            }
                        })
                })
                .then((result) => {
                    onUpdateComplete()
                    return result
                })
        }

        /**
         * Return the props that are intended for the wrapped component, excluding
         * private or test-only props for this HOC.
         */
        getChildProps() {
            const excludes = ['onGetPropsComplete', 'onGetPropsError', 'onUpdateComplete']
            return Object.assign(
                {},
                ...Object.entries(this.props)
                    .filter((entry) => excludes.indexOf(entry[0]) < 0)
                    .map(([k, v]) => ({[k]: v}))
            )
        }

        render() {
            return <Wrapped {...this.getChildProps()} {...this.state.childProps} />
        }
    }

    RouteComponent.displayName = `routeComponent(${wrappedComponentName})`

    RouteComponent.defaultProps = {
        onGetPropsComplete: noop,
        onGetPropsError: noop,
        onUpdateComplete: noop
    }

    RouteComponent.propTypes = {
        location: PropTypes.object,
        match: PropTypes.object,
        onGetPropsComplete: PropTypes.func,
        onGetPropsError: PropTypes.func,
        onUpdateComplete: PropTypes.func
    }

    const excludes = {
        shouldGetProps: true,
        getProps: true,
        getTemplateName: true
    }
    hoistNonReactStatic(RouteComponent, Wrapped, excludes)

    return withErrorHandling(withRouter(RouteComponent))
}

/**
 * Wrap all the components found in the application's route config with the
 * route-component HOC so that they all support `getProps` methods server-side
 * and client-side in the same way.
 *
 * @private
 */
export const getRoutes = (locals) => {
    const allRoutes = [...routes, {path: '*', component: Throw404}]
    return allRoutes.map(({component, ...rest}) => {
        return {
            component: component ? routeComponent(component, true, locals) : component,
            ...rest
        }
    })
}
