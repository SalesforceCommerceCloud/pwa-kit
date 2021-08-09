/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Logger from '../../utils/logger'
import {getAssetUrl} from '../../asset-utils'
import Const from './constants'
import {startVisitCountdown, initStorage} from '../../utils/messaging-state'

let _instance

// Exported for testing
export const _showFrame = (frame) => {
    frame.style.transform = ''
}

// Exported for testing
export const _hideFrame = (frame) => {
    frame.style.transform = 'translateY(100%)'
}

// Exported for testing
export const _clickHandler = function(event) {
    const targetId = event.target.id

    switch (targetId) {
        case Const.BUTTON_DENY_ID: {
            _hideFrame(this.frame)
            startVisitCountdown(this.config.deferOnDismissal, this.config.channelName)
            break
        }

        case Const.BUTTON_ALLOW_ID: {
            _hideFrame(this.frame)
            window.Mobify.WebPush.PWAClient.subscribe().then((state) => {
                let message

                if (state.subscribed) {
                    message = `Subscribed ${
                        this.config.channelName
                            ? `to channel ${this.config.channelName}`
                            : /* istanbul ignore next */ ''
                    }`
                } else if (!state.canSubscribe) {
                    message = 'Permissions blocked by user; can no longer subscribe.'
                } else {
                    // The user dismissed the system-ask - back-off from asking again
                    startVisitCountdown(this.config.deferOnDismissal, this.config.channelName)
                    message = 'System ask was dismissed'
                }

                this.logger.log('[Messaging UI]', message)

                return state
            })
            break
        }
    }
}

const AskFrame = function(configuration, doc = document) {
    if (_instance) {
        return _instance
    }

    initStorage()

    this.config = configuration
    this.doc = doc
    this.logger = new Logger('[Messaging UI]')

    _instance = this

    return _instance
}

AskFrame.prototype.show = function() {
    // Say that we showed a channel offer - it's okay for config.channel to be
    // undefined - Messaging Client will construe that as broadcast
    window.Mobify.WebPush.PWAClient.channelOfferShown()

    setTimeout(() => {
        this.logger.log('Showing ask dialog')
        _showFrame(this.frame)
    })

    return this
}

AskFrame.prototype.setupListeners = function(clickHandler) {
    // Can provide clickHandler for testing purposes
    clickHandler = clickHandler || /* istanbul ignore next */ _clickHandler.bind(this)

    const buttonContainer = this.frameDoc.getElementsByClassName(Const.BUTTON_CONTAINER_CLASS)[0]
    buttonContainer.addEventListener('click', clickHandler)

    return this
}

AskFrame.prototype.create = function() {
    if (this.frame) {
        return this
    }

    this.logger.log('Creating ask dialog...')

    this.frame = this.doc.createElement('iframe')
    const parentBody = this.doc.getElementsByTagName('body')[0]

    // Create the iframe
    this.frame.src = 'about:blank'
    this.frame.id = Const.ASK_IFRAME_ID

    const styles = {
        position: 'fixed',
        left: '0px',
        bottom: '0px',
        zIndex: Number.MAX_SAFE_INTEGER,
        width: '100%',
        height: '59px',
        border: 'none',
        transition: 'transform 0.3s ease-in-out',
        transform: 'translateY(100%)'
    }

    Object.assign(this.frame.style, styles)

    parentBody.appendChild(this.frame)

    // HTML injection
    this.frameDoc = this.frame.contentWindow.document
    this.frameDoc.getElementsByTagName('html')[0].innerHTML = this.config.html

    // Stylesheet injection
    const iframeStyles = this.frameDoc.createElement('link')
    iframeStyles.rel = 'stylesheet'
    iframeStyles.type = 'text/css'
    iframeStyles.href = getAssetUrl(Const.ASK_CSS)
    this.frameDoc.getElementsByTagName('head')[0].appendChild(iframeStyles)

    // User-defined script injection
    const iframeScript = this.frameDoc.createElement('script')
    iframeScript.type = 'text/javascript'
    iframeScript.src = getAssetUrl(Const.ASK_SCRIPT)

    this.frameDoc.getElementsByTagName('body')[0].appendChild(iframeScript)

    this.logger.log('Ask dialog created')

    return this
}

export default AskFrame
