import React from 'react'
import * as generator from './generator'
import path from 'path'
import fs from 'fs'
import os from 'os'
import rimraf from 'rimraf'
import {shallow} from 'enzyme'
import configureStore from 'redux-mock-store'
import Immutable from 'immutable'

jest.mock('progressive-web-sdk/scripts/common')
const common = require('progressive-web-sdk/scripts/common')
const storeFactory = configureStore()
const initialData = () => ({ui: {pages: {testContainer: Immutable.fromJS({})}}})

test('askQuestions generates an appropriate object', () => {
    const result = {Name: 'test'}
    common.getUserInput.mockImplementation(() => Promise.resolve(result))
    return generator.askQuestions().then((input) => {
        expect(input).toEqual(result)
    })
})

test('buildContext works appropriately', () => {
    const ctx = {Name: 'TestContainer'}
    const result = {
        Name: 'TestContainer',
        name: 'testContainer',
        dirname: 'test-container',
        NAME: 'TEST_CONTAINER',
        actionsName: 'testContainerActions',
        getSelectorName: 'getTestContainer',
        COMPONENT_NAMESPACE: 'c'
    }
    expect(generator.buildContext(ctx)).toEqual(result)
})

test('processFile copies inputFile to outputFile', () => {
    const ctx = generator.buildContext({Name: 'TestContainer'})
    const inputDir = path.resolve('scripts', 'generator', 'assets', 'page-skeleton', 'index.jsx')
    const outputDir = path.resolve(os.tmpdir(), 'index.jsx')
    expect(fs.existsSync(inputDir)).toBe(true)
    expect(fs.existsSync(outputDir)).toBe(false)
    return generator.processFile(inputDir, outputDir, ctx).then(() => {
        expect(fs.existsSync(outputDir)).toBe(true)
        fs.unlinkSync(outputDir)
    })
})

describe('Page is generated appropriately and works as expected', () => {
    let inputDir
    let outputDir
    let inputFiles

    beforeAll(() => {
        const result = {Name: 'TestContainer'}
        common.getUserInput.mockImplementation(() => Promise.resolve(result))

        inputDir = path.resolve('scripts', 'generator', 'assets', 'page-skeleton')
        outputDir = path.resolve('app', 'pages')
        inputFiles = fs.readdirSync(inputDir)
    })

    afterAll(() => {
        rimraf.sync(path.resolve(outputDir, 'test-container'))
    })

    test('The main module creates an appropriate page folder', () => {
        return generator.main({inputDir, outputDir}).then(() => {
            const outputFiles = fs.readdirSync(path.resolve(outputDir, 'test-container'))
            expect(outputFiles.length).toEqual(inputFiles.length)
            expect(outputFiles).toEqual(inputFiles)
        })
    })

    test('The generated page renders', () => {
        jest.mock(path.resolve('app', 'analytics'), () => jest.fn())
        const TestContainer = require(path.resolve(outputDir, 'test-container', 'index.jsx'))
            .default
        const store = storeFactory(initialData())
        const props = {
            params: {},
            initializeTestContainer: jest.fn(),
            trackPageLoad: jest.fn()
        }
        const wrapper = shallow(<TestContainer {...props} />, {context: {store}})
        expect(wrapper.html()).toBe('<div class="t-test-container"><pre>{}</pre></div>')
    })
})
