import React from 'react'

export class FetchStrategy extends React.Component {
    render() {
        return <div />
    }

    static async initAppState(args) {
        try {
            const promises = this.getInitializers().map((fn) => fn(args))
            return {
                error: undefined,
                appState: Object.assign({}, ...(await Promise.all(promises)))
            }
        } catch (error) {
            return {
                error: error || new Error(),
                appState: {}
            }
        }
    }
}
