import Cookies from 'js-cookie'

export abstract class BaseStorage {
    abstract set(key: string, value: string, options?: any): void
    abstract get(key: string): string
    abstract delete(key: string): void
}

export class CookieStorage extends BaseStorage {
    constructor() {
        super()
        if (typeof document === 'undefined') {
            throw new Error('CookieStorage is not avaliable on the current environment.')
        }
    }
    set(key: string, value: string, options?: Cookies.CookieAttributes) {
        Cookies.set(key, value, {secure: true, ...options})
    }
    get(key: string) {
        return Cookies.get(key) || ''
    }
    delete(key: string) {
        Cookies.remove(key)
    }
}

export class LocalStorage extends BaseStorage {
    constructor() {
        super()
        if (typeof window === 'undefined') {
            throw new Error('LocalStorage is not avaliable on the current environment.')
        }
    }
    set(key: string, value: string, options?: any) {
        window.localStorage.setItem(key, value)
    }
    get(key: string) {
        return window.localStorage.getItem(key) || ''
    }
    delete(key: string) {
        window.localStorage.removeItem(key)
    }
}
