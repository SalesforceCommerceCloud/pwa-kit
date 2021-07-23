import React from 'react'
import {fireEvent} from '@testing-library/react'
import {renderWithProviders} from '../../utils/test-utils'
import Hero from './index'

test('Hero renders without errors', () => {
    const data = {
        title: 'title',
        label: 'label',
        actions: undefined,
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
        label: 'label',
        actions: <button data-testid="button" onClick={onClick}></button>,
        img: {
            src: 'src',
            alt: 'alt'
        }
    }
    const {getByTestId} = renderWithProviders(<Hero {...data} />)
    const button = getByTestId('button')
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
})
