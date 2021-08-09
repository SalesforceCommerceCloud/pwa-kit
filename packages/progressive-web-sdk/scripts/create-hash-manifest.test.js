/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const Promise = require('bluebird')

jest.mock('./utils')
const Utils = require('./utils')

jest.mock('mkdirp')
const mkdirp = require('mkdirp')

jest.mock('glob')
const glob = require('glob')

jest.mock('crypto')
const crypto = require('crypto')

jest.mock('./file-utils')
const fileUtils = require('./file-utils')

const createHashManifest = require('./create-hash-manifest')

const successCallbackAdapter = (value = true) => (...args) => {
    args[args.length - 1](null, value)
}

const failureCallbackAdapter = (value = {}) => (...args) => {
    args[args.length - 1](value)
}

test('createHashManifest fails if no baseDir is specified', () => {
    Utils.fail.mockClear()
    Utils.fail.mockImplementationOnce(() => {
        throw new Error()
    })

    try {
        createHashManifest({})
    } catch (e) {
        // Ignore
    }

    expect(Utils.fail).toBeCalled()
})

test("createHashManifest creates the destinationFolder if it doesn't exist", () => {
    Utils.exists.mockClear()
    Utils.exists.mockReturnValueOnce(Promise.reject())

    mkdirp.mockClear()
    mkdirp.mockImplementationOnce(failureCallbackAdapter())

    return createHashManifest({baseDir: 'base', destinationFolder: 'dest'}).then(() => {
        expect(Utils.exists).toBeCalledWith('dest')
        expect(mkdirp).toBeCalled()
        expect(mkdirp.mock.calls[0][0]).toBe('dest')
    })
})

test('createHashManifest fails if no files are provided', () => {
    ;['*.js', []].forEach((files) => {
        Utils.exists.mockReturnValueOnce(Promise.resolve())

        Utils.fail.mockClear()
        Utils.fail.mockImplementationOnce(() => {
            throw new Error()
        })

        return createHashManifest({baseDir: 'base', destinationFolder: 'dest', files}).then(() => {
            expect(Utils.fail).toBeCalled()
            expect(Utils.fail.mock.calls[0][0].startsWith('[Error:')).toBe(true)
        })
    })
})

test('createHashManifest globs all of the given patterns', () => {
    Utils.exists.mockReturnValueOnce(Promise.resolve())

    glob.mockClear()
    glob.mockImplementation(failureCallbackAdapter())

    return createHashManifest({
        baseDir: 'base',
        destinationFolder: 'dest',
        files: ['build/*.js', 'images/*.png']
    }).then(() => {
        expect(glob).toHaveBeenCalledTimes(2)
        expect(glob.mock.calls[0][0]).toBe('build/*.js')
        expect(glob.mock.calls[0][1]).toEqual({nodir: true})
        expect(glob.mock.calls[1][0]).toBe('images/*.png')
        expect(glob.mock.calls[1][1]).toEqual({nodir: true})
    })
})

test('createHashManifest hashes all of the files returned from glob', () => {
    Utils.exists.mockReturnValueOnce(Promise.resolve())

    glob.mockClear()
    glob.mockImplementationOnce(successCallbackAdapter(['first.png', 'test.js']))

    fileUtils.readFile.mockImplementation(() => Promise.resolve(''))

    crypto.createHash.mockImplementation(() => {
        throw new Error()
    })

    return createHashManifest({
        baseDir: 'base',
        destinationFolder: 'dest',
        files: ['build/*.js']
    }).then(() => {
        expect(fileUtils.readFile).toHaveBeenCalledTimes(2)
        expect(fileUtils.readFile).toHaveBeenCalledWith('first.png')
        expect(fileUtils.readFile).toHaveBeenCalledWith('test.js')

        expect(crypto.createHash).toHaveBeenCalledTimes(2)
        expect(crypto.createHash).toBeCalledWith('md5')
    })
})

test('createHashManifest fails on readFile error', () => {
    Utils.fail.mockClear()
    Utils.fail.mockImplementationOnce(() => {
        throw new Error()
    })

    Utils.exists.mockReturnValueOnce(Promise.resolve())

    glob.mockImplementationOnce(successCallbackAdapter(['first.png', 'test.js']))

    fileUtils.readFile.mockImplementation(() => Promise.reject())

    return createHashManifest({
        baseDir: 'base',
        destinationFolder: 'dest',
        files: ['build/*.js']
    }).then(() => {
        expect(Utils.fail).toBeCalled()
    })
})

test('createHashManifest aggregates all of the hashes and writes them to files', () => {
    Utils.exists.mockReturnValueOnce(Promise.resolve())

    const filenames = {
        'build/*.js': ['first.png', 'test.js'],
        'assets/*': ['second.png']
    }
    glob.mockClear()
    glob.mockImplementation((...args) => successCallbackAdapter(filenames[args[0]])(...args))

    fileUtils.readFile.mockClear()
    fileUtils.readFile.mockImplementation((fn) => Promise.resolve(fn))

    const fileHashes = {
        'first.png': 'abcdef',
        'test.js': '012345',
        'second.png': '678901'
    }
    const cryptoMock = {
        update: (fn) => ({
            digest(type) {
                expect(type).toBe('hex')
                return fileHashes[fn]
            }
        })
    }

    crypto.createHash.mockClear()
    crypto.createHash.mockReturnValue(cryptoMock)

    fileUtils.jsonWrite.mockClear()
    const mockWriter = jest.fn()
    fileUtils.jsonWrite.mockReturnValue(mockWriter)

    return createHashManifest({
        baseDir: '.',
        destinationFolder: 'dest',
        files: ['build/*.js', 'assets/*'],
        hashLength: 6
    }).then(() => {
        expect(glob).toHaveBeenCalledTimes(2)
        expect(fileUtils.readFile).toHaveBeenCalledTimes(3)
        expect(crypto.createHash).toHaveBeenCalledTimes(3)

        expect(mockWriter).toHaveBeenCalledTimes(2)

        const appManifest = mockWriter.mock.calls[0][0]

        expect(appManifest.hashes).toEqual(fileHashes)
        expect(appManifest.buildDate).toBeGreaterThan(Date.now() - 5000)

        const loaderManifest = mockWriter.mock.calls[1][0]

        expect(loaderManifest.hashes).toEqual({})
        expect(loaderManifest.buildDate).toBe(appManifest.buildDate)
    })
})
