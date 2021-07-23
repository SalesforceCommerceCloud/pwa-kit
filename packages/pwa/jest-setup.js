import 'raf/polyfill' // fix requestAnimationFrame issue with polyfill
import '@testing-library/jest-dom/extend-expect'
import {Crypto} from '@peculiar/webcrypto'

// This file consists of global mocks for jsdom.
class LocalStorageMock {
    constructor() {
        this.store = {}
    }
    clear() {
        this.store = {}
    }
    getItem(key) {
        return this.store[key] || null
    }
    setItem(key, value) {
        this.store[key] = value.toString()
    }
    removeItem(key) {
        delete this.store[key]
    }
}

const localStorageMock = new LocalStorageMock()

Object.defineProperty(window, 'crypto', {
    value: new Crypto()
})

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

Object.defineProperty(window, 'scrollTo', {
    value: () => null
})

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
    }))
})
