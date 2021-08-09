/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const Promise = require('bluebird')
const path = require('path')

jest.mock('prompt')
const prompt = require('prompt')

jest.mock('./file-utils')
const fileUtils = require('./file-utils')

jest.mock('./console-output')
const consoleOutput = require('./console-output')

const common = require('./common')

const successCallbackAdapter = (value = true) => (...args) => {
    args[args.length - 1](null, value)
}

const testConverter = (converter, cases) => {
    cases.forEach(([input, output]) => {
        expect(converter(input)).toEqual(output)
    })
}

test('component adds the component path', () => {
    testConverter(common.component, [
        ['this.jsx', path.join(common.APP_COMPONENT_DIR, 'this.jsx')],
        [
            path.join('my-component', 'index.jsx'),
            path.join(common.APP_COMPONENT_DIR, 'my-component', 'index.jsx')
        ]
    ])
})

test('container adds the container path', () => {
    testConverter(common.container, [
        ['reducer.js', path.join(common.APP_CONTAINER_DIR, 'reducer.js')],
        [
            path.join('my-container', 'action.test.js'),
            path.join(common.APP_CONTAINER_DIR, 'my-container', 'action.test.js')
        ]
    ])
})

test('asset adds the asset path', () => {
    testConverter(common.asset, [
        ['reducer.template.js', path.join(common.ASSET_DIR, 'reducer.template.js')],
        [
            path.join('component-skeleton', 'example.jsx'),
            path.join(common.ASSET_DIR, 'component-skeleton', 'example.jsx')
        ]
    ])
})

test('canonicalizeName converts acronyms to lower case', () => {
    testConverter(common.canonicalizeName, [
        ['URLShortener', 'UrlShortener'],
        ['TestURLThing', 'TestUrlThing'],
        ['FetchJSON', 'FetchJson'],
        ['testCCName', 'testCcName']
    ])
})

test('camel2Pascal does that', () => {
    testConverter(common.camel2Pascal, [
        ['camelCase', 'CamelCase'],
        ['PascalCase', 'PascalCase'],
        ['camel2Pascal', 'Camel2Pascal']
    ])
})

test('camel2Dashed works', () => {
    testConverter(common.camel2Dashed, [
        ['camelCase', 'camel-case'],
        ['testCamel2', 'test-camel-2'],
        ['thisCamelCaseIdentifierHasLotsOfParts', 'this-camel-case-identifier-has-lots-of-parts'],
        ['embeddedUrlAcronym', 'embedded-url-acronym']
    ])
})

test('dashed2Camel works', () => {
    testConverter(common.dashed2Camel, [
        ['test-dashed', 'testDashed'],
        ['many-dashes-at-once', 'manyDashesAtOnce'],
        ['embedded-url-acronym', 'embeddedUrlAcronym']
    ])
})

test('pascal2Camel works', () => {
    testConverter(common.pascal2Camel, [
        ['camelCase', 'camelCase'],
        ['PascalCase', 'pascalCase'],
        ['Pascal2Camel', 'pascal2Camel']
    ])
})

test('pascal2Dashed works', () => {
    testConverter(common.pascal2Dashed, [
        ['CamelCase', 'camel-case'],
        ['TestCamel2', 'test-camel-2'],
        ['ThisCamelCaseIdentifierHasLotsOfParts', 'this-camel-case-identifier-has-lots-of-parts'],
        ['EmbeddedUrlAcronym', 'embedded-url-acronym']
    ])
})

test('getUserInput should get input from prompt passing the schema', () => {
    const schema = [
        {
            name: 'Test1',
            type: 'string'
        },
        {
            name: 'Test2',
            type: 'boolean'
        }
    ]
    const result = {Test1: 'test', Test2: false}

    prompt.start.mockClear()
    prompt.get.mockClear()
    prompt.get.mockImplementationOnce(successCallbackAdapter(result))

    return common.getUserInput(schema).then((input) => {
        expect(prompt.start).toBeCalled()
        expect(prompt.get).toBeCalled()
        expect(prompt.get.mock.calls[0][0]).toEqual(schema)
        expect(input).toEqual(result)
    })
})

test('buildContext should transform the name correctly', () => {
    const transformStub = jest.fn()
    transformStub.mockReturnValue('path!')

    const result = common.buildContext(transformStub)({Name: 'TestName'})

    expect(result.name).toBe('testName')
    expect(result.dirname).toBe('test-name')
    expect(transformStub).toHaveBeenCalledTimes(1)
    expect(transformStub).toBeCalledWith('test-name')
    expect(result.path).toBe('path!')
    expect(result.actionsName).toBe('testNameActions')
    expect(result.getSelectorName).toBe('getTestName')
})

test('findTemplateFilenames finds the template files in the given directory', () => {
    const contents = ['mobify', 'progressive', 'web', 'sdk']
    fileUtils.readdirAsync.mockImplementation(() => Promise.resolve(contents))

    const context = {test: true}
    const result = common.findTemplateFilenames('testdir')(context)

    expect(result.length).toBe(2)
    expect(result[0]).toBe(context)
    expect(result[1]).toBeInstanceOf(Promise)

    return result[1].then((result) => {
        expect(result).toEqual(contents)
        expect(fileUtils.readdirAsync).toBeCalled()
        expect(fileUtils.readdirAsync.mock.calls[0][0].endsWith('testdir'))
    })
})

test('processTemplate substitutes context variables', () => {
    const testTemplate = 'This is <%= context.noun %>. We expect to see <%= context.verbNoun %>'
    const testContext = {
        noun: 'a test',
        verbNoun: 'substitution'
    }

    const result = common.processTemplate(testContext)(testTemplate)

    expect(result).toBe('This is a test. We expect to see substitution')
})

test('transformFile reads a file, does template substitution, and writes it to a new path', () => {
    fileUtils.readFile.mockClear()
    fileUtils.readFile.mockReturnValueOnce(Promise.resolve('This is a <%= context.type %>'))

    fileUtils.writeToPath.mockClear()
    const pathWriter = jest.fn()
    fileUtils.writeToPath.mockReturnValueOnce(pathWriter)

    return common.transformFile('input.txt', {type: 'template'}, 'output.txt', true).then(() => {
        expect(fileUtils.readFile).toBeCalled()
        expect(fileUtils.readFile.mock.calls[0][0].endsWith('input.txt')).toBe(true)

        expect(fileUtils.writeToPath).toBeCalled()
        expect(fileUtils.writeToPath).toBeCalledWith('output.txt')

        expect(pathWriter).toBeCalled()
        expect(pathWriter).toBeCalledWith('This is a template')
    })
})

test('outputName puts the file in the path', () => {
    expect(common.outputName('test.js', {path: path.join('path', 'to', 'output')})).toBe(
        path.join('path', 'to', 'output', 'test.js')
    )
})

test("outputName replaces 'example' with the directory name", () => {
    expect(common.outputName('example.js', {path: 'output', dirname: 'test'})).toBe(
        path.join('output', 'test.js')
    )
})

test('fileTransformer creates a transform function with fixed context', () => {
    fileUtils.readFile.mockClear()
    fileUtils.readFile.mockReturnValueOnce(Promise.resolve('This is a <%= context.type %>'))

    fileUtils.writeToPath.mockClear()
    const pathWriter = jest.fn()
    fileUtils.writeToPath.mockReturnValueOnce(pathWriter)

    const fn = common.fileTransformer(
        {type: 'template', path: 'output', dirname: 'test'},
        'skeleton'
    )
    expect(typeof fn).toBe('function')

    return fn('thing.txt').then(() => {
        expect(fileUtils.readFile).toBeCalled()
        expect(
            fileUtils.readFile.mock.calls[0][0].endsWith(path.join('skeleton', 'thing.txt'))
        ).toBe(true)

        expect(fileUtils.writeToPath).toBeCalled()
        expect(fileUtils.writeToPath).toBeCalledWith(path.join('output', 'thing.txt'))

        expect(pathWriter).toBeCalled()
        expect(pathWriter).toBeCalledWith('This is a template')
    })
})

test('clearNulls removes null values and only null values', () => {
    const result = common.clearNulls([1, null, 'test', undefined, null])

    expect(result).toEqual([1, 'test', undefined])
})

test('step should pass the (later) value to the operation', () => {
    const operation = jest.fn()
    const fn = common.step('test', operation)
    expect(operation).not.toBeCalled()
    expect(typeof fn).toBe('function')

    return fn('value!').then(() => {
        expect(operation).toBeCalledWith('value!')
    })
})

test("step should log about what it's doing", () => {
    const fn = common.step('test', () => {
        expect(consoleOutput.plainWrite).toHaveBeenCalledTimes(1)
        expect(consoleOutput.plainWrite).toHaveBeenCalledWith('test')
        expect(consoleOutput.printCheckMark).not.toBeCalled()
    })

    expect(consoleOutput.plainWrite).not.toBeCalled()
    expect(consoleOutput.printCheckMark).not.toBeCalled()

    return fn().then(() => {
        expect(consoleOutput.plainWrite).toHaveBeenCalledTimes(1)
        expect(consoleOutput.printCheckMark).toHaveBeenCalledTimes(1)
    })
})
