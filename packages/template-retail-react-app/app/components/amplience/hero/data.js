export const heroTestData = {
    content: {
        _meta: {
            name: 'Hero',
            schema: 'https://sfcc.com/components/hero',
            deliveryId: '81cbd4ca-e71b-40f5-b944-19d466bbde36'
        },
        title: 'The React PWA Starter Store for Retail',
        img: {
            image: {
                _meta: {
                    schema: 'http://bigcontent.io/cms/schema/v1/core#/definitions/image-link'
                },
                id: '9350bcc5-3a22-4e4d-be56-03e1c31aaa09',
                name: 'hero',
                endpoint: 'sfcccomposable',
                defaultHost: 'cdn.media.amplience.net'
            },
            alt: 'img'
        },
        actions: [
            {
                label: 'Get Started',
                url:
                    'https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/getting-started.html'
            }
        ]
    }
}
