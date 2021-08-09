/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* eslint import/no-commonjs:0 */
require('@babel/register')
const chromedriver = require('chromedriver')
const path = require('path')

const NIGHTWATCH_SAUCE_USERNAME = process.env.NIGHTWATCH_SAUCE_USERNAME
const NIGHTWATCH_SAUCE_ACCESS_KEY = process.env.NIGHTWATCH_SAUCE_ACCESS_KEY
const NIGHTWATCH_SRC_FOLDERS = (
    process.env.NIGHTWATCH_SRC_FOLDERS || path.resolve(process.cwd(), 'tests', 'e2e')
).split(' ')
const NIGHTWATCH_OUTPUT_FOLDER =
    process.env.NIGHTWATCH_OUTPUT_FOLDER || path.resolve(process.cwd(), 'tests', 'reports')
const NIGHTWATCH_SCREENSHOTS_PATH =
    process.env.NIGHTWATCH_SCREENSHOTS_PATH || path.resolve(process.cwd(), 'tests', 'screenshots')

const nodeModules = path.resolve(process.cwd(), 'node_modules')

module.exports = {
    src_folders: NIGHTWATCH_SRC_FOLDERS,
    output_folder: NIGHTWATCH_OUTPUT_FOLDER,
    custom_commands_path: path.resolve(
        nodeModules,
        '@mobify',
        'test-framework',
        'src',
        'mobify-nightwatch-commands',
        'commands'
    ),
    webdriver: {
        start_process: true
    },

    test_settings: {
        default: {
            webdriver: {
                server_path: chromedriver.path,
                port: 9515
            },
            globals: {
                waitForConditionTimeout: 10000,
                waitForConditionPollInterval: 100
            },
            end_session_on_fail: false,
            silent: true,
            output: true,
            exclude: ['page-objects', 'sauce-connect', 'test-scripts'],
            screenshots: {
                enabled: true,
                path: NIGHTWATCH_SCREENSHOTS_PATH,
                on_failure: true
            },
            desiredCapabilities: {
                browserName: 'chrome',
                loggingPrefs: {driver: 'OFF', server: 'OFF', browser: 'OFF'},
                chromeOptions: {
                    mobileEmulation: {
                        deviceName: 'Pixel 2'
                    },
                    args: ['--allow-running-insecure-content', '--test-type']
                },
                javascriptEnabled: true,
                acceptSslCerts: true
            }
        },
        chrome_incognito: {
            webdriver: {
                server_path: chromedriver.path,
                port: 9515,
                start_process: true
            },
            desiredCapabilities: {
                browserName: 'chrome',
                chromeOptions: {
                    mobileEmulation: {
                        deviceName: 'Pixel 2'
                    },
                    args: ['--allow-running-insecure-content', '--test-type']
                },
                javascriptEnabled: true,
                acceptSslCerts: true
            }
        },
        // To be run with Appium.
        // Run the simulator beforehand and accept the certificate
        safari: {
            automationName: 'XCUITest',
            exclude: ['page-objects', 'test-scripts'],
            selenium_start_process: false,
            selenium_port: 4723,
            selenium_host: '0.0.0.0',
            desiredCapabilities: {
                app: '',
                browserName: 'Safari',
                platformName: 'iOS',
                platformVersion: '11.2',
                deviceName: 'iPhone 6s',
                useNewWDA: 'false',
                xcodeOrgId: 'KS9S3B73SG',
                xcodeSigningId: 'iPhone Developer',
                javascriptEnabled: true
            }
        },
        saucelabs_ios: {
            selenium_start_process: false,
            selenium_port: 4445,
            selenium_host: 'localhost',
            silent: true,
            exclude: ['page-objects', 'test-scripts'],
            username: NIGHTWATCH_SAUCE_USERNAME,
            access_key: NIGHTWATCH_SAUCE_ACCESS_KEY,
            desiredCapabilities: {
                browserName: 'Safari',
                appiumVersion: '1.7.2',
                deviceName: 'iPhone 7 Simulator',
                platformVersion: '11.2',
                platformName: 'iOS'
            }
        },
        saucelabs_android: {
            selenium_start_process: false,
            selenium_port: 4445,
            selenium_host: 'localhost',
            silent: true,
            username: NIGHTWATCH_SAUCE_USERNAME,
            access_key: NIGHTWATCH_SAUCE_ACCESS_KEY,
            desiredCapabilities: {
                browserName: 'Chrome',
                appiumVersion: '1.7.2',
                deviceName: 'Google Pixel GoogleAPI Emulator',
                platformVersion: '7.0',
                platformName: 'Android'
            }
        }
    }
}
