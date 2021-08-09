// MOBIFY PROGRESSIVE SERVICE WORKER LOADER
// DO NOT MODIFY WITHOUT APPROVAL FROM MOBIFY

// This is an example Service Worker
// To see how it's injected into a site, check out: https://docs.mobify.com/progressive-web/latest/guides/developing-without-the-mobify-tag/
// This file will only work in preview mode and when the worker is available on localhost
const isPreview = /preview=true/.test(self.location.search)

if (isPreview) {
    self.importScripts('https://localhost:8443/worker.js')
} else {
    self.importScripts('https://cdn.mobify.com/sites/example/production/worker.js')
}
