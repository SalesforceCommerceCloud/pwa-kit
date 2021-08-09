/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
const chromedriver = require('chromedriver')
const path = require('path')

const NIGHTWATCH_SRC_FOLDERS = (
    process.env.NIGHTWATCH_SRC_FOLDERS || path.resolve(process.cwd(), 'tests', 'e2e')
).split(' ')
const NIGHTWATCH_OUTPUT_FOLDER =
    process.env.NIGHTWATCH_OUTPUT_FOLDER || path.resolve(process.cwd(), 'tests', 'reports')
const NIGHTWATCH_PAGE_OBJECTS_PATH =
    process.env.NIGHTWATCH_PAGE_OBJECTS_PATH ||
    path.resolve(process.cwd(), 'tests', 'e2e', 'page-objects')
const NIGHTWATCH_SCREENSHOTS_PATH =
    process.env.NIGHTWATCH_SCREENSHOTS_PATH || path.resolve(process.cwd(), 'tests', 'screenshots')

module.exports = {
    src_folders: NIGHTWATCH_SRC_FOLDERS,
    output_folder: NIGHTWATCH_OUTPUT_FOLDER,
    page_objects_path: NIGHTWATCH_PAGE_OBJECTS_PATH,
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
        }
    }
}
