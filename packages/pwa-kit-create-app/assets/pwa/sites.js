// eslint-disable-next-line
exports.template = () => `// Provide the sites for your app. Each site includes site id, and its localization configuration.
// You can also provide alias for your locale. They will be used in place of your locale id when generating paths across the app
module.exports = [
    {
        id: 'RefArch',
        l10n: {
            supportedCurrencies: ['USD'],
            defaultCurrency: 'USD',
            defaultLocale: 'en-US',
            supportedLocales: [
                {
                    id: 'en-US',
                    // alias: 'us',
                    preferredCurrency: 'USD'
                }
            ]
        }
    }
]`
