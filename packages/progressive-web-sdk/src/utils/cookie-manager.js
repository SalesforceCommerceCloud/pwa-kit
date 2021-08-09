/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const POLL_TIME_INTERVAL = 50
const POLL_TIME_LIMIT = 3000

let pollStartTime

let nextSubscriberKey = 0
const subscribers = {}

class CookieSubscriber {
    constructor(name, updateCallback) {
        /* istanbul ignore else */
        if (!subscribers[name]) {
            subscribers[name] = {}
        }

        this.updateCallback = updateCallback
        this.cookieName = name
        this._subscribePosition = nextSubscriberKey

        subscribers[name][this._subscribePosition] = this

        nextSubscriberKey++
    }

    unsubscribe() {
        delete subscribers[this.cookieName][this._subscribePosition]
    }
}

// This class is a singleton
class CookieManager {
    constructor() {
        this.pollTimeLimit = POLL_TIME_LIMIT
        this.pollTimeInterval = POLL_TIME_INTERVAL
    }

    isCookieSet(name) {
        const cookieRegex = new RegExp(`${name}=([^;]+)`)
        return cookieRegex.exec(document.cookie)
    }

    set(name, value, domain, lifetime) {
        const expires = new Date()
        const now = Date.now()
        const setExpiry = lifetime > 0

        if (setExpiry) {
            expires.setTime(now + lifetime)
        }

        /* istanbul ignore next */
        document.cookie = `${name}=${value};${
            setExpiry ? ` expires=${expires.toGMTString()};` : ''
        } path=/; ${domain && domain !== 'localhost' ? `domain=${domain}` : ''}`
    }

    get(name, defaultValue = null) {
        const cookieMatch = this.isCookieSet(name)

        return cookieMatch ? cookieMatch[1] : defaultValue
    }

    subscribe(name, updateCallback) {
        return new CookieSubscriber(name, updateCallback)
    }

    _pollForCookieUpdate(cookieName) {
        const cookieValue = this.get(cookieName)

        /* istanbul ignore else */
        if (cookieValue) {
            const cookieSubscribers = subscribers[cookieName]

            Object.keys(cookieSubscribers).forEach((key) => {
                cookieSubscribers[key].updateCallback(cookieValue)
            })
        } else {
            /* istanbul ignore else */
            if (
                cookieName &&
                cookieName !== '' &&
                Date.now() - pollStartTime < this.pollTimeLimit
            ) {
                setTimeout(() => {
                    this._pollForCookieUpdate(cookieName)
                }, this.pollTimeInterval)
            }
        }
    }

    pollForAllCookieUpdate() {
        pollStartTime = Date.now()
        Object.keys(subscribers).forEach((key) => {
            if (Object.keys(subscribers[key]).length) {
                this._pollForCookieUpdate(key)
            }
        })
    }
}

const cookieManager = new CookieManager()

export default cookieManager
