/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow} from 'enzyme/build'
import React from 'react'
import {clearOrigin} from '../../asset-utils'
import DebugInfo from './debug-info-prod'

const addMobifyTagScript = () => {
    const script = global.document.createElement('script')
    script.src = '//cdn.mobify.com/sites/companyxyz-mobile/company-xyz-production/adaptive.js'
    script.id = 'mobify-v8-tag'
    global.document.body.appendChild(script)
}

const setupWindowMobify = (isPreview = true) => {
    global.Mobify = {}
    global.Mobify.isPreview = isPreview
}

const removeMobifyTagScript = () => {
    const scripts = Array.from(document.getElementsByTagName('script'))
    scripts.forEach((script) => script.parentElement.removeChild(script))
}

describe('Tesing DebugInfo in prod environment', () => {
    beforeEach(() => {
        setupWindowMobify()
        addMobifyTagScript()
    })

    afterAll(function() {
        clearOrigin()
        removeMobifyTagScript()
        delete process.env.NODE_ENV
    })

    test('should be empty component in production environment', () => {
        const wrapper = shallow(<DebugInfo />)
        expect(wrapper.isEmptyRender()).toBe(true)
    })
})
