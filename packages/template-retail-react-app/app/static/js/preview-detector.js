/**
 * This script will detect preview.client.js script is present in the storefront
 * If it is present, it will inform the runtime admin to if Preview is enabled
 */
addEventListener('load', (event) => {
    window.addEventListener('message', ({data}) => {
        const {source, event, payload} = data
        if (source !== 'runtime-admin') {
            return
        }
        if (event === 'preview') {
            const previewClient = document.getElementById('preview-script')
            if (previewClient) {
                window.parent.postMessage(
                    {
                        source: 'pwa-kit-preview-client',
                        event: 'preview',
                        payload: 'initialized'
                    },
                    '*'
                )
            } else {
                window.parent.postMessage(
                    {
                        source: 'pwa-kit-preview-client',
                        event: 'preview',
                        payload: 'not-found'
                    },
                    '*'
                )
            }
        }
    })
})
