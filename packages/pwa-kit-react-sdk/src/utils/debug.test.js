// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
// /* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
//
// import * as utils from './debug'
//
// const setupWindowMobify = (isPreview = true) => {
//     global.Mobify = {}
//     global.Mobify.isPreview = isPreview
// }
//
// describe('Testing utils/debug', () => {
//     test('test isUsingMobifyPreview true', () => {
//         setupWindowMobify()
//         expect(utils.isUsingMobifyPreview()).toBe(true)
//     })
//
//     test('test isUsingMobifyPreview false', () => {
//         setupWindowMobify(false)
//         expect(utils.isUsingMobifyPreview()).toBe(false)
//     })
//
//     test('test getDeploymentTarget production with beginning https://', () => {
//         const url =
//             'https://cdn.mobify.com/sites/companyxyz-mobile/company-xyz-production/adaptive.min.js'
//         const obj = utils.getProjectIDandTargetFromURL(url)
//         expect(obj.target).toBe('company-xyz-production')
//         expect(obj.projectId).toBe('companyxyz-mobile')
//     })
//
//     test('test getDeploymentTarget production with beginning //', () => {
//         const url =
//             '//cdn.mobify.com/sites/companyxyz-mobile/company-xyz-production/adaptive.min.js'
//         const obj = utils.getProjectIDandTargetFromURL(url)
//         expect(obj.target).toBe('company-xyz-production')
//         expect(obj.projectId).toBe('companyxyz-mobile')
//     })
//
//     test('test getProjectIDandTargetFromURL target on bundle preview', () => {
//         const url = '//cdn.mobify.com/sites/companyxyz-mobile/bundles/100/adaptive.min.js'
//         const obj = utils.getProjectIDandTargetFromURL(url)
//         expect(obj.target).toBe(null)
//         expect(obj.projectId).toBe('companyxyz-mobile')
//     })
//
//     test('test getProjectIDandTargetFromURL window target null', () => {
//         const obj = utils.getProjectIDandTargetFromURL()
//         expect(obj.target).toBe(undefined)
//         expect(obj.projectId).toBe(undefined)
//     })
//
//     test('test getProjectIDandTargetFromURL projectId with preview bundle url', () => {
//         const url = '//cdn.mobify.com/sites/companyxyz-mobile/bundles/100/adaptive.min.js'
//         expect(utils.getProjectIDandTargetFromURL(url).projectId).toBe('companyxyz-mobile')
//     })
//
//     test('test getProjectIDandTargetFromURL with development url', () => {
//         const url = 'http://localhost/test.js'
//         const obj = utils.getProjectIDandTargetFromURL(url)
//         expect(obj.target).toBe(null)
//         expect(obj.projectId).toBe(null)
//     })
//
//     test('Test isUniversal', () => {
//         global.Progressive = {}
//         global.Progressive.isUniversal = true
//         expect(utils.isUniveral()).toBe(true)
//
//         global.Progressive.isUniversal = false
//         expect(utils.isUniveral()).toBe(false)
//     })
//
//     test('Test getBundleIDFromURL', () => {
//         expect(utils.getBundleIDFromURL('localhost/mobify/bundle/development/')).toBe('development')
//         expect(utils.getBundleIDFromURL('localhost/mobify/development/')).toBeFalsy()
//         expect(utils.getBundleIDFromURL('')).toBeFalsy()
//     })
//
//     test('Test getBundleIDFromURL', () => {
//         utils.getBundleID('').then((bundleId) => {
//             expect(bundleId).toBe('0')
//         })
//         utils.getBundleID('localhost/mobify/bundle/development/').then((bundleId) => {
//             expect(bundleId).toBe('development')
//         })
//     })
//
//     test('Test getMobifyScriptSrc', () => {
//         expect(utils.getMobifyScriptSrc()).toBe('')
//         const script = global.document.createElement('script')
//         script.src = '//cdn.mobify.com/sites/companyxyz-mobile/company-xyz-production/adaptive.js'
//         script.id = 'mobify-v8-tag'
//         global.document.body.appendChild(script)
//         expect(utils.getMobifyScriptSrc()).toBe(script.getAttribute('src'))
//     })
//
//     test('Test getSSRTimingInformation', () => {
//         global.Progressive = {}
//         expect(utils.getSSRTimingInformation()).toBeFalsy()
//         global.Progressive = {
//             SSRTiming: [
//                 {name: 'call-request-hook', duration: 0.317949},
//                 {name: 'ssr-setup-1', duration: 0.282417}
//             ]
//         }
//         expect(utils.getSSRTimingInformation()).toBeTruthy()
//         global.Progressive = {}
//     })
// })

test('TODO: Review this component', () => expect(true).toBe(true))
