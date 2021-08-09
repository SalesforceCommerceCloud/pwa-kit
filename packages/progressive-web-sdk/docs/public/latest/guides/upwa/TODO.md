UPWA docs to complete

* the load cycle (ssr-loader)
* deployment and what happens (invalidation)
* ssr error handling (i.e. UPWA errors)
* what a typical dev workflow looks like (npm run ssr, npm run ssr:inspect)
    * warning of chunks not in ssrShared
* CSS optimization? (did we doc the config option)
* A list of `window.Progressive` values & Redux store values - link from the lifecycle detail page?
* Target options
    * IP whitelisting
    * static IPs
* restrictions in the JSDom environment (no UA, stuff that doesn't load)
* routes include query params but NOT cookies
* maybe add to the Architecture pages (docs/public/latest/architecture)
* diagrams (do last)
* explanation of how the whole getBrowserSize stuff works

Add these to docs/public/latest/reference/upwa/lifecycle/index.md

## Client-side <a name="UPWALifecycleClientSide" href="#UPWALifecycleClientSide">#</a>

### Loading <a name="UPWALifecycleLoading" href="#UPWALifecycleLoading">#</a>

### Hydration<a name="UPWALifecycleHydration" href="#UPWALifecycleHydration">#</a>

### Post-hydration <a name="UPWALifecyclePostHydration" href="#UPWALifecyclePostHydration">#</a>

## The `window.Progressive` object  <a name="WindowProgressive" href="#WindowProgressive">#</a>
