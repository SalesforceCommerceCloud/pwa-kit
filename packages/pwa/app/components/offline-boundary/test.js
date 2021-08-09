import React from 'react'
import {mount, shallow} from 'enzyme'
import {BrowserRouter as Router} from 'react-router-dom'

import OfflineBoundary, {UnwrappedOfflineBoundary} from './index'

class ChunkLoadError extends Error {
    constructor(...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params)
        this.name = 'ChunkLoadError'
    }
}

export const shallowWithRouter = (node) => shallow(<Router>{node}</Router>)
export const mountWithRouter = (node) => mount(<Router>{node}</Router>)

describe('The OfflineBoundary', () => {
    beforeEach(() => {
        // React's logging is noisey even when an Error Boundary catches. Silence
        // the distracting logs during tests, since they are expected in any event.
        jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        console.error.mockRestore()
    })

    test('should render its children', () => {
        const wrapper = shallowWithRouter(
            <OfflineBoundary isOnline={true}>
                <div id="child">child</div>
            </OfflineBoundary>
        )
        expect(wrapper.find('#child').length).toBe(1)
    })

    test('should render the error splash when a child throws a chunk load error', () => {
        const ThrowingComponent = () => {
            throw new ChunkLoadError()
        }
        const wrapper = mountWithRouter(
            <OfflineBoundary isOnline={true}>
                <div>
                    <ThrowingComponent />
                    <div id="child">child</div>
                </div>
            </OfflineBoundary>
        )
        expect(wrapper.length).toBe(1)
        expect(wrapper.find('.c-offline-boundary').length).toBe(1)
        expect(wrapper.find('#child').length).toBe(0)
    })

    test('should re-throw errors that are not chunk load errors', () => {
        const ThrowingComponent = () => {
            throw new Error('Anything else')
        }
        expect(() => {
            mountWithRouter(
                <OfflineBoundary isOnline={true}>
                    <div>
                        <ThrowingComponent />
                        <div id="child">child</div>
                    </div>
                </OfflineBoundary>
            )
        }).toThrow()
    })

    test('should render the error splash when a child throws a chunk load error', () => {
        const ThrowingComponent = () => {
            throw new ChunkLoadError()
        }
        const wrapper = mountWithRouter(
            <OfflineBoundary isOnline={true}>
                <div>
                    <ThrowingComponent />
                    <div id="child">child</div>
                </div>
            </OfflineBoundary>
        )
        expect(wrapper.length).toBe(1)
        expect(wrapper.find('.c-offline-boundary').length).toBe(1)
        expect(wrapper.find('#child').length).toBe(0)
    })

    test('should attempt to reload the page when the user clicks retry', () => {
        let firstRender = true
        const ThrowingOnceComponent = () => {
            if (firstRender) {
                firstRender = false
                throw new ChunkLoadError()
            } else {
                return <div id="child">child</div>
            }
        }
        const wrapper = mountWithRouter(
            <OfflineBoundary isOnline={true}>
                <ThrowingOnceComponent />
            </OfflineBoundary>
        )
        const component = wrapper.find('OfflineBoundary')

        expect(component.state('chunkLoadError')).toBe(true)

        const button = wrapper.find('.qa-retry-button').first()

        button.simulate('click')
        expect(component.state('chunkLoadError')).toBe(false)
        expect(wrapper.find('#child').length).toBe(1)
    })

    test('should derive state from a chunk load error', () => {
        const derived = UnwrappedOfflineBoundary.getDerivedStateFromError(
            new ChunkLoadError('test')
        )
        expect(derived).toEqual({chunkLoadError: true})
    })
})
