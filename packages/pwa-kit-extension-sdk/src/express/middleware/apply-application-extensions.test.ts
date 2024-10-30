/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import express, {Application, Request, Response} from 'express'
import supertest from 'supertest'
import applyApplicationExtensions from './apply-application-extensions'
import {getApplicationExtensions} from '../placeholders/application-extensions'

// Mock the getApplicationExtensions function
jest.mock('../placeholders/application-extensions', () => ({
    getApplicationExtensions: jest.fn()
}))

describe('applyApplicationExtensions Middleware with Express App', () => {
    let app: Application

    const createAppWithMiddleware = () => {
        app = express()
        app.use(applyApplicationExtensions(app))
        app.get('/test', (req: Request, res: Response) => {
            res.status(200).json({message: 'Middleware reached'})
        })
    }

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('should call next function and reach the endpoint', async () => {
        // Mock getApplicationExtensions before creating the app
        ;(getApplicationExtensions as jest.Mock).mockReturnValue([])
        createAppWithMiddleware()

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        const response = await supertest(app).get('/test')

        expect(response.status).toBe(200)
        expect(response.body.message).toBe('Middleware reached')
    })

    test('should not modify the app if no enabled extensions are returned', async () => {
        const mockExtensions = [{isEnabled: jest.fn().mockReturnValue(false), extendApp: jest.fn()}]
        ;(getApplicationExtensions as jest.Mock).mockReturnValue(mockExtensions)
        createAppWithMiddleware()

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        const response = await supertest(app).get('/test')

        expect(response.status).toBe(200)
        expect(response.body.message).toBe('Middleware reached')
        expect(mockExtensions[0].extendApp).not.toHaveBeenCalled()
    })

    test('should apply enabled extensions by calling extendApp', async () => {
        const mockExtension = {
            isEnabled: jest.fn().mockReturnValue(true),
            extendApp: jest.fn().mockImplementation((inputApp: Application) => inputApp)
        }
        ;(getApplicationExtensions as jest.Mock).mockReturnValue([mockExtension])
        createAppWithMiddleware()

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        const response = await supertest(app).get('/test')

        expect(mockExtension.isEnabled).toHaveBeenCalled()
        expect(mockExtension.extendApp).toHaveBeenCalledWith(app)
        expect(response.status).toBe(200)
        expect(response.body.message).toBe('Middleware reached')
    })

    test('should apply multiple enabled extensions in sequence', async () => {
        const firstExtension = {
            isEnabled: jest.fn().mockReturnValue(true),
            extendApp: jest.fn().mockImplementation((inputApp: Application) => inputApp)
        }
        const secondExtension = {
            isEnabled: jest.fn().mockReturnValue(true),
            extendApp: jest.fn().mockImplementation((inputApp: Application) => inputApp)
        }
        ;(getApplicationExtensions as jest.Mock).mockReturnValue([firstExtension, secondExtension])
        createAppWithMiddleware()

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        const response = await supertest(app).get('/test')

        expect(firstExtension.extendApp).toHaveBeenCalledWith(app)
        expect(secondExtension.extendApp).toHaveBeenCalledWith(app)
        expect(response.status).toBe(200)
        expect(response.body.message).toBe('Middleware reached')
    })
})
