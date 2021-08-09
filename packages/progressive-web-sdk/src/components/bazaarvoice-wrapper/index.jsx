/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'

// This is not a real component, this is just a placeholder used to ensure the
// README.md file gets auto-generated into our docs!
export const bazaarvoiceWrapper = () => <div />

/**
 * This Higher Order Component can be used to construct
 * components that use Bazaarvoice.
 * It loads the Bazaarvoice API script once
 * and renders its wrapped component after the script has been loaded.
 * This means that the wrapped components can use componentDidMount
 * to run any initialization code that relies on the api script.
 */

const scriptClass = 'js-bvapi'
const loadingClass = 'pw--loading'
const loadedClass = 'pw--loaded'

const bazaarvoiceWrapperHOC = (WrappedComponent) => {
    class BazaarvoiceWrapper extends React.Component {
        constructor(props) {
            super(props)

            this.state = {
                apiLoaded: false
            }
            this.script = null
            this.WrappedComponent = WrappedComponent
            this.onScriptLoad = this.onScriptLoad.bind(this)
        }

        componentDidMount() {
            const {apiSrc} = this.props

            const existingScript = document.querySelector(`.${scriptClass}`)

            if (!existingScript) {
                this.script = document.createElement('script')
                this.script.src = apiSrc
                this.script.className = `${scriptClass} ${loadingClass}`
                this.script.addEventListener('load', this.onScriptLoad)
                this.script.addEventListener('error', this.props.onError)
                document.body.appendChild(this.script)
            } else if (
                new RegExp(loadedClass).test(existingScript.className) ||
                window.BV ||
                window.$BV
            ) {
                // Another instance has already loaded this script
                this.setState({
                    apiLoaded: true
                })
            } else {
                // A bazaarvoice script is already on the page, but hasn't loaded yet
                this.script = existingScript
                existingScript.addEventListener('load', this.onScriptLoad)
                existingScript.addEventListener('error', this.props.onError)
            }
        }

        onScriptLoad() {
            this.setState({
                apiLoaded: true
            })
            if (this.props && this.props.apiVersion === '1') {
                window.$BV.configure('global', this.props.configurationOptions)
            }
            this.script.classList.remove(loadingClass)
            this.script.classList.add(loadedClass)
        }

        componentWillUnmount() {
            if (this.script) {
                this.script.removeEventListener('load', this.onScriptLoad)
                this.script.removeEventListener('error', this.props.onError)
            }
        }

        render() {
            return this.state.apiLoaded ? <WrappedComponent {...this.props} /> : false
        }
    }
    BazaarvoiceWrapper.WrappedComponent = WrappedComponent
    BazaarvoiceWrapper.defaultProps = {
        configurationOptions: {},
        onError: () => {},
        apiVersion: '1'
    }
    BazaarvoiceWrapper.propTypes = {
        apiSrc: PropTypes.string,
        apiVersion: PropTypes.string,
        configurationOptions: PropTypes.object,
        onError: PropTypes.func
    }

    return BazaarvoiceWrapper
}

export default bazaarvoiceWrapperHOC
