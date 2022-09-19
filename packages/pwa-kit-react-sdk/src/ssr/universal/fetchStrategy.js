import React from 'react'

/**
 * @private
 */
export class FetchStrategy extends React.Component {
    render() {
        return <div />
    }

    /**
     * @private
     */
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
