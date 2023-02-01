/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

jest.mock('fs')
const fs = require('fs')

const fileUtils = require('./file-utils')

const successCallbackAdapter = (value = true) => (...args) => {
    args[args.length - 1](null, value)
}

const failureCallbackAdapter = (value = {}) => (...args) => {
    args[args.length - 1](value)
}

const argsIgnoringCallback = (mock, index = 0) => mock.mock.calls[index].slice(0, -1)

beforeEach(() => {
    jest.resetAllMocks()
})

test('readFile reads as utf8', () => {
    fs.readFile.mockImplementation(successCallbackAdapter())

    return fileUtils.readFile('test.dat').then(() => {
        expect(fs.readFile).toBeCalled()
        expect(fs.readFile.mock.calls[0].slice(0, -1)).toEqual(['test.dat', 'utf8'])
    })
})

test('writeFile writes as utf8', () => {
    fs.writeFile.mockImplementation(successCallbackAdapter())

    return fileUtils.writeFile('myfile.json', '{"test": true, "json": "JSON"}').then(() => {
        expect(fs.writeFile.mock.calls.length).toBe(1)
        expect(fs.writeFile.mock.calls[0].slice(0, -1)).toEqual([
            'myfile.json',
            '{"test": true, "json": "JSON"}',
            'utf8'
        ])
    })
})

test('writeToPath returns a function that writes to a given path', () => {
    fs.writeFile.mockImplementation(successCallbackAdapter())

    const writer = fileUtils.writeToPath('test/summary.dat')

    expect(typeof writer).toBe('function')
    expect(fs.writeFile).not.toBeCalled()

    return writer('ABC 123').then(() => {
        expect(fs.writeFile).toBeCalled()
        expect(fs.writeFile.mock.calls[0].slice(0, -1)).toEqual([
            'test/summary.dat',
            'ABC 123',
            'utf8'
        ])
    })
})

test('mkdirIfNonexistent does not make a directory if it exists', () => {
    fs.stat.mockImplementation(successCallbackAdapter({test: true}))

    return fileUtils.mkdirIfNonexistent('testdir').then((result) => {
        expect(fs.stat).toHaveBeenCalledTimes(1)
        expect(argsIgnoringCallback(fs.stat)).toEqual(['testdir'])
        expect(fs.mkdir).not.toBeCalled()
        expect(result.test).toBe(true)
    })
})

test("mkdirIfNonexistent makes a directory if it doesn't exist", () => {
    fs.stat.mockImplementation(failureCallbackAdapter('test'))
    fs.mkdir.mockImplementation(successCallbackAdapter())

    return fileUtils.mkdirIfNonexistent('testdir').then(() => {
        expect(fs.stat).toBeCalled()
        expect(argsIgnoringCallback(fs.stat)).toEqual(['testdir'])
        expect(fs.mkdir).toBeCalled()
        expect(argsIgnoringCallback(fs.mkdir)).toEqual(['testdir'])
    })
})

test('existsSync calls statSync and returns true if it succeeds', () => {
    fs.statSync.mockReturnValueOnce(true)
    expect(fileUtils.existsSync('test.dat')).toBe(true)
    expect(fs.statSync.mock.calls.length).toBe(1)
    expect(fs.statSync.mock.calls[0][0]).toBe('test.dat')
})

test('existsSync returns false if statSync throws', () => {
    fs.statSync.mockImplementation(() => {
        throw new Error('test')
    })

    expect(fileUtils.existsSync('test.dat')).toBe(false)
})

test('filterDirectories returns the names that are directories after passing through the pathBuilder', () => {
    const dirList = ['a', 'c', 'r']
    const itemList = ['a', 'b', 'c', 'r', 's', 't']

    fs.stat.mockImplementation((fn, callback) => {
        if (dirList.indexOf(fn) !== -1) {
            callback(null, {isDirectory: () => true})
        } else if (fn === 's') {
            callback({err: true})
        } else {
            callback(null, {isDirectory: () => false})
        }
    })

    const pathBuilder = jest.fn().mockImplementation((x) => x)

    return fileUtils
        .filterDirectories(pathBuilder)(itemList)
        .then((result) => {
            expect(fs.stat.mock.calls.length).toBe(itemList.length)
            expect(pathBuilder.mock.calls.length).toBe(itemList.length)
            itemList.forEach((item) => {
                expect(pathBuilder).toBeCalledWith(item)
            })

            expect(result).toEqual(dirList)
        })
})

test('filterFiles returns the names that are directories after passing through the pathBuilder', () => {
    const fileList = ['b', 't']
    const itemList = ['a', 'b', 'c', 'r', 's', 't']

    fs.stat.mockImplementation((fn, callback) => {
        if (fileList.indexOf(fn) !== -1) {
            callback(null, {isFile: () => true})
        } else if (fn === 's') {
            callback({err: true})
        } else {
            callback(null, {isFile: () => false})
        }
    })

    const pathBuilder = jest.fn().mockImplementation((x) => x)

    return fileUtils
        .filterFiles(pathBuilder)(itemList)
        .then((result) => {
            expect(fs.stat.mock.calls.length).toBe(itemList.length)
            expect(pathBuilder.mock.calls.length).toBe(itemList.length)
            itemList.forEach((item) => {
                expect(pathBuilder).toBeCalledWith(item)
            })

            expect(result).toEqual(fileList)
        })
})

test('jsonRead reads JSON from a file', () => {
    fs.readFile.mockImplementation(successCallbackAdapter('{"test": true}'))

    return fileUtils.jsonRead('test.json').then((result) => {
        expect(fs.readFile).toBeCalled()
        expect(fs.readFile.mock.calls[0][0]).toBe('test.json')

        expect(result).toEqual({test: true})
    })
})

test('jsonWrite writes JSON to a file', () => {
    fs.writeFile.mockImplementation(successCallbackAdapter())

    return fileUtils
        .jsonWrite('test.json')({test: true})
        .then(() => {
            expect(fs.writeFile).toBeCalled()
            expect(fs.writeFile.mock.calls[0][0]).toBe('test.json')
            expect(fs.writeFile.mock.calls[0][1]).toBe('{\n  "test": true\n}')
        })
})
