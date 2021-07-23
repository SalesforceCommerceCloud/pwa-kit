module.exports = {
    // The different Lighthouse CI configuration options:
    // https://github.com/GoogleChrome/lighthouse-ci/blob/master/docs/configuration.md
    ci: {
        collect: {
            startServerCommand: 'npm run start',
            //TODO: Add key pages URLs here as they are implemented.
            url: ['http://localhost:3000/'],
            startServerReadyPattern: 'HTTP development server listening on',
            startServerReadyTimeout: 15000
        },
        upload: {
            target: 'temporary-public-storage'
        },
        assert: {
            aggregationMethod: 'median',
            assertions: {
                //TODO: Adjust scores and the assertions level from 'warn' to 'error' to fail the build if the scores are not met.
                'categories:performance': ['warn', {minScore: 0.8}],
                'categories:pwa': ['warn', {minScore: 0.9}],
                'categories:seo': ['warn', {minScore: 0.9}],
                'categories:accessibility': ['error', {minScore: 0.96}]
            }
        }
    }
}
