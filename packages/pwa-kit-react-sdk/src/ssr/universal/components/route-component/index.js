/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import PropTypes from 'prop-types'
import React from 'react'
import {withRouter} from 'react-router-dom'
import hoistNonReactStatic from 'hoist-non-react-statics'
import {AppErrorContext} from '../../components/app-error-boundary'
import AppConfig from '../../components/_app-config'
import {pages as pageEvents} from '../../events'

const noop = () => undefined

const isServerSide = typeof window === 'undefined'
const isHydrating = () => !isServerSide && window.__HYDRATING__

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

    WithErrorHandling.displayName = `withErrorHandling(${wrappedComponentName})`
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
                childProps: {
                    // When serverside or hydrating, forward props from the frozen app state
                    // to the wrapped component.
                    ...(isServerSide || isHydrating() ? this.props.preloadedProps : undefined),
                    isLoading: false
                }
            }

            this._suppressUpdate = false
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
            const component = await Wrapped.getComponent()

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
         * Before the promise is returned, a reference is stored for later
         * comparision with a call to isLatestPropsPromise. This is used to
         * resolve race conditions when there are multiple getProps calls
         * active.
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
         * @param {Boolean} args.isLoading - the current execution state of `getProps`,
         *    `true` while `getProp` is executing, and `false` when it's not.
         *
         * @return {Promise<Object>}
         */
        // eslint-disable-next-line
        static getProps(args) {
            // console.log('GETPROPS: ', Wrapped.getComponent)
            // if (!Wrapped.getComponent) {
            //     console.log('THE FOLLOWING COMPONENT SHOULD HAVE GETPROPS: ', Wrapped.name)
            //     return
            // }
            RouteComponent._latestPropsPromise = Wrapped.getComponent().then((component) =>
                component.getProps ? component.getProps({...args, ...extraArgs}) : Promise.resolve()
            )
            return RouteComponent._latestPropsPromise
        }

        /**
         * Check if a promise is still the latest call to getProps. This is used
         * to check if the results are outdated before using them.
         *
         * @param {Promise} propsPromise - The promise from the call to getProps to check
         * @returns true or false
         */
        static isLatestPropsPromise(propsPromise) {
            return propsPromise === RouteComponent._latestPropsPromise
        }

        componentDidMount() {
            this.componentDidUpdate({})
        }

        async componentDidUpdate(previousProps) {
            // Because we are setting the component state from within this function we need a
            // guard prevent various events (update, error, complete, and load) from being
            // called multiple times.
            if (this._suppressUpdate) {
                this._suppressUpdate = false
                return
            }

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

            // The wasHydratingOnUpdate flag MUST only be used to decide whether
            // or not to call static lifecycle methods.  Do not use it in
            // component rendering - you will not be able to trigger updates,
            // because this is intentionally outside of a component's
            // state/props.
            const wasHydratingOnUpdate = isHydrating()

            /* istanbul ignore next */
            // Don't getProps() when hydrating - the server has already done
            // getProps() frozen the state in the page.
            const shouldGetPropsNow = async () => {
                return (
                    !wasHydratingOnUpdate &&
                    (await RouteComponent.shouldGetProps({
                        previousLocation,
                        location,
                        previousParams,
                        params
                    }))
                )
            }

            const setStateAsync = (newState) => {
                return new Promise((resolve) => {
                    this.setState(newState, resolve)
                })
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
            console.log(
                'WRAPPED COMPONENT: ',
                Wrapped.name,
                Wrapped.displayName,
                Wrapped.getTemplateName
            )
            const templateName = await Wrapped.getTemplateName()

            const start = now()

            const emitPageLoadEvent = (templateName, end) =>
                isPage && pageEvents.pageLoad(templateName, start, end)

            const emitPageErrorEvent = (name, content) => isPage && pageEvents.error(name, content)

            // If hydrating, we know that the server just fetched and
            // rendered for us, embedding the app-state in the page HTML.
            // For that reason, we don't ever do getProps while Hydrating.
            // However, we still want to report a page load time for this
            // initial render. Rather than fetching again, trigger the event
            // right away and do nothing.

            if (wasHydratingOnUpdate) {
                emitPageLoadEvent(templateName, now())
            }

            const willGetProps = await shouldGetPropsNow()

            if (!willGetProps) {
                onUpdateComplete()
                return
            }

            try {
                this._suppressUpdate = true

                await setStateAsync({
                    childProps: {
                        ...this.state.childProps,
                        isLoading: true
                    }
                })

                /**
                 * When a user triggers two getProps for the same component,
                 * we'd like to always use the one for the later user action
                 * instead of the one that resolves last. getProps
                 * stores a reference to the promise that we check before we use
                 * the results from it.
                 */
                const req = undefined
                const res = undefined
                const propsPromise = RouteComponent.getProps({
                    req,
                    res,
                    params,
                    location
                })
                const childProps = await propsPromise

                this._suppressUpdate = false

                if (RouteComponent.isLatestPropsPromise(propsPromise)) {
                    await setStateAsync({
                        childProps: {
                            ...childProps,
                            isLoading: false
                        }
                    })
                }

                onGetPropsComplete()
                emitPageLoadEvent(templateName, now())
            } catch (err) {
                onGetPropsError(err)
                emitPageErrorEvent(templateName, err)
            }

            onUpdateComplete()
        }

        /**
         * Return the props that are intended for the wrapped component, excluding
         * private or test-only props for this HOC.
         */
        getChildProps() {
            const excludes = [
                'onGetPropsComplete',
                'onGetPropsError',
                'onUpdateComplete',
                'preloadedProps'
            ]
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
        onUpdateComplete: PropTypes.func,
        preloadedProps: PropTypes.object
    }

    const excludes = {
        // shouldGetProps: true,
        // getProps: true,
        // getTemplateName: true
    }
    hoistNonReactStatic(RouteComponent, Wrapped, excludes)

    return withErrorHandling(withRouter(RouteComponent))
}
