import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithReactIntl} from '../../utils/test-utils'
import Error from './index'

test('Error renders without errors', () => {
    expect(renderWithReactIntl(<Error />))
})

test('Error status 500', () => {
    renderWithReactIntl(<Error status={500} />)
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
        'Sorry, there is a problem with this page 😔'
    )
})

test('Error status 404', () => {
    renderWithReactIntl(<Error status={404} />)
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
        'Sorry, we cannot find this page 😓'
    )
})

test('Error status 500 with stack trace', () => {
    renderWithReactIntl(<Error status={500} stack={'Stack trace error message'} />)
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
        'Sorry, there is a problem with this page 😔'
    )
    expect(screen.getByText(/stack trace error message/i)).toBeInTheDocument()
})
