import React from 'react'

export class FetchStrategy extends React.Component {
    render() {
        return <div />
    }

    static async initAppState(args) {
        try {
            const initializers = this.getInitializers()
            const promises = initializers.map((fn) => fn(args))
            const results = await Promise.all(promises)
            const appState = Object.assign({}, ...results)
            return {
                error: undefined,
                appState: appState
            }
        } catch (error) {
            return {
                error: error || new Error(),
                appState: {}
            }
        }
    }
}
