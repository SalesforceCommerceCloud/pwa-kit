/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from './ssr-config.client'

let windowSpy

beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get')
})

afterEach(() => {
    windowSpy.mockRestore()
})

describe('Client getConfig', () => {
    test('returns window.__CONFIG__ value', () => {
        windowSpy.mockImplementation(() => ({
            __CONFIG__: {}
        }))

        expect(getConfig()).toEqual({})
    })

    test('parses config from mobify-data element when window.__CONFIG__ is not available', () => {
        const mockConfig = { key: 'value' };
        const mockInnerHTML = JSON.stringify({ __CONFIG__: mockConfig });

        windowSpy.mockImplementation(() => ({
            __CONFIG__: undefined,
            document: {
                getElementById: jest.fn().mockReturnValue({ innerHTML: mockInnerHTML })
            }
        }));

        expect(getConfig()).toEqual(mockConfig);
    });

    test('sets all globals on window object', () => {
        const mockData = { __CONFIG__: { key: 'value' }, otherKey: 'otherValue' };
        const mockInnerHTML = JSON.stringify(mockData);

        const mockWindow = {
            __CONFIG__: undefined,
            document: {
                getElementById: jest.fn().mockReturnValue({ innerHTML: mockInnerHTML })
            }
        };

        windowSpy.mockImplementation(() => mockWindow);

        getConfig();

        expect(mockWindow.__CONFIG__).toEqual(mockData.__CONFIG__);
        expect(mockWindow.otherKey).toEqual(mockData.otherKey);
    });

    test('handles JSON parsing error', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        windowSpy.mockImplementation(() => ({
            __CONFIG__: undefined,
            document: {
                getElementById: jest.fn().mockReturnValue({ innerHTML: 'invalid JSON' })
            }
        }));

        expect(getConfig()).toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenCalledWith('Unable to parse server-side rendered config.');

        consoleSpy.mockRestore();
    });
});
