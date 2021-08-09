/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const fs = require('fs')

jest.mock('request')
const Request = require('request')
const tmp = require('tmp')

const Utils = require('./utils')
const MessagingUtils = require('./messaging-utils')

let realFail
let realReadCredentials

beforeEach(() => {
    realFail = Utils.fail
    Utils.fail = jest.fn()

    realReadCredentials = Utils.readCredentials
    Utils.readCredentials = jest.fn(() =>
        Promise.resolve({
            username: 'tester',
            api_key: '0xCAFEFADE'
        })
    )
})

afterEach(() => {
    Utils.fail = realFail
    Utils.readCredentials = realReadCredentials
})

describe('generateCSR', () => {
    let realWriteFileSync

    beforeEach(() => {
        realWriteFileSync = fs.writeFileSync
        fs.writeFileSync = jest.fn()
    })

    afterEach(() => {
        fs.writeFileSync = realWriteFileSync
    })

    test('generateCSR success', () => {
        const fakeCSRFile = 'this is a fake CSR file'
        Request.mockImplementation((options, callback) => {
            callback(
                null, // error
                {
                    statusCode: 200
                },
                fakeCSRFile
            )
        })

        return MessagingUtils.generateCSR({
            // options
            siteConfig: {
                apn_app_id: 'com.mobify.app',
                apn_native_certificate_name: 'com.mobify.app'
            },
            messagingPath: './messaging',
            messagingSiteId: 'merlinspotions',
            argv: {
                $0: 'the-command'
            }
        }).then(() => {
            const writeCall = fs.writeFileSync.mock.calls[0]
            expect(writeCall).toBeTruthy()
            expect(writeCall[0]).toEqual('./messaging/com.mobify.app.csr')
            expect(writeCall[1]).toEqual(fakeCSRFile)
        })
    })

    test('generateCSR failure in POST', () => {
        Request.mockImplementation((options, callback) => {
            callback('fake failure', {})
        })

        return MessagingUtils.generateCSR({
            // options
            siteConfig: {
                apn_app_id: 'com.mobify.app',
                apn_native_certificate_name: 'com.mobify.app'
            },
            messagingPath: './messaging',
            messagingSiteId: 'merlinspotions',
            argv: {
                $0: 'the-command'
            }
        }).catch((error) => {
            expect(error).toBeDefined()
            expect(Utils.fail).toHaveBeenCalledTimes(2)
            expect(fs.writeFileSync).toHaveBeenCalledTimes(0)
        })
    })

    test('generateCSR failure in config', () => {
        MessagingUtils.generateCSR({
            // options
            siteConfig: {},
            messagingPath: './messaging',
            messagingSiteId: 'merlinspotions',
            argv: {
                $0: 'the-command'
            }
        })
        expect(Utils.fail).toHaveBeenCalledTimes(1)
        expect(fs.writeFileSync).toHaveBeenCalledTimes(0)
    })
})

describe('uploadToBackend', () => {
    let messagingDirectory
    let messagingPath

    beforeEach(() => {
        messagingDirectory = tmp.dirSync()
        expect(fs.existsSync(messagingDirectory.name)).toBeTruthy()

        // Put some files in the directory
        messagingPath = messagingDirectory.name
        fs.writeFileSync(`${messagingPath}/abc.yaml`, 'This is not a real YAML file')
        fs.writeFileSync(`${messagingPath}/abc.cer`, 'This is not a real CER file')

        expect(fs.readdirSync(messagingPath)).toHaveLength(2)

        Request.mockReset()
        Utils.fail.mockReset()
    })

    afterEach(() => {
        if (messagingDirectory) {
            fs.readdirSync(messagingPath).forEach((filename) =>
                fs.unlinkSync(`${messagingPath}/${filename}`)
            )
            messagingDirectory.removeCallback()
        }
    })
})

describe('sendTestMessage', () => {
    const theOptions = {
        siteConfig: {
            target_domain: 'www.merlinspotions.com'
        },
        messagingSiteId: 'merlinspotions',
        argv: {
            $0: 'the-command',
            client_id: '0123456789abcdef',
            title: 'the title',
            text: 'the text'
        }
    }

    test('sendTestMessage failure', () => {
        Request.mockReset()
        Request.mockImplementation((options, callback) => {
            callback(
                null, // error
                {
                    statusCode: 200
                },
                JSON.stringify({
                    error_code: 'some-error-code',
                    error: 'some error message'
                })
            )
        })

        return MessagingUtils.sendTestMessage(theOptions).catch(() => {
            expect(Utils.fail).toHaveBeenCalledTimes(1)
            expect(Request).toHaveBeenCalledTimes(1)
        })
    })
})
