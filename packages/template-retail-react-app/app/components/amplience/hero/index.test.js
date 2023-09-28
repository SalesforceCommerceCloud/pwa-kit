import React from 'react'
import {fireEvent} from '@testing-library/react'
import {renderWithProviders} from '../../../utils/test-utils'
import Hero from './index'

test('Hero renders without errors', () => {
    const data = {
        title: 'title',
        actions: [],
        img: {
            src: 'src',
            alt: 'alt'
        }
    }
    const {getByText} = renderWithProviders(<Hero {...data} />)
    expect(getByText(/title/i)).toBeInTheDocument()
})

test('Hero renders actions and event handlers', () => {
    const onClick = jest.fn()
    const data = {
        title: 'title',
        actions: [{label: 'test', url: 'http://test.com'}],
        img: {
            image: {
                _meta: {
                    schema: 'http://bigcontent.io/cms/schema/v1/core#/definitions/image-link'
                },
                id: '9350bcc5-3a22-4e4d-be56-03e1c31aaa09',
                name: 'hero',
                endpoint: 'sfcccomposable',
                defaultHost: 'cdn.media.amplience.net'
            },
            alt: 'img'
        }
    }
    const {getByTestId} = renderWithProviders(<Hero {...data} />)
    const button = getByTestId('button')
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
})
