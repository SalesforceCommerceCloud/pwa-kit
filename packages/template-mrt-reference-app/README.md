# template-mrt-reference-app

This is the reference app that the Managed Runtime Team uses to test
features in the platform (eg. TLS versions, successful deploys, proxy
behaviour).

This app is intended to be a thin layer over the bare minimum SDKs
that we expect/require all MRT users to use.

Although MRT started life primarily as a hosting environment for
React apps, we're expanding that to support other technologies –
this app lets us test those platform features that are universal
across all apps, regardless of framework choice.


## Usage in CI/CD tests ⛅️

This app is deployed to several pre-existing test Targets as part 
of a "smoke-test" of the MRT platform. To see the Targets in use
take a look at the CI config in

https://git.soma.salesforce.com/cc-mobify/ssr-infrastructure/blob/sfci-main/Jenkinsfile#L176

These smoke-tests are triggered by merges to the main development 
branch of the above repository.
