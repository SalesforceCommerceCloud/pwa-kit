/**
 * Call requestIdleCallback in supported browsers.
 *
 * https://developers.google.com/web/updates/2015/08/using-requestidlecallback
 * http://caniuse.com/#feat=requestidlecallback
 */
export const requestIdleCallback = (fn) => {
    if ('requestIdleCallback' in window) {
        return window.requestIdleCallback(fn)
    } else {
        return setTimeout(() => fn(), 1)
    }
}

export const watchOnlineStatus = (callback, win = window) => {
    const off = () => callback(false)
    const on = () => callback(true)
    win.addEventListener('offline', off)
    win.addEventListener('online', on)
    const unsubscribe = () => {
        win.removeEventListener('offline', off)
        win.removeEventListener('online', on)
    }
    return unsubscribe
}
