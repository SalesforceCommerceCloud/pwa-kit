/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {render, screen, fireEvent} from '@testing-library/react'
import {useOtpInputs} from '@salesforce/retail-react-app/app/hooks/use-otp-inputs'

const TestComponent = ({length = 4, onComplete}) => {
    const otp = useOtpInputs(length, onComplete)
    const [lastCode, setLastCode] = useState('')

    return (
        <div>
            <div data-testid="code">{lastCode}</div>
            {Array.from({length}).map((_, index) => (
                <input
                    key={index}
                    data-testid={`otp-${index}`}
                    ref={(el) => (otp.inputRefs.current[index] = el)}
                    value={otp.values[index]}
                    onChange={(e) => setLastCode(otp.setValue(index, e.target.value) || '')}
                    onKeyDown={(e) => otp.handleKeyDown(index, e)}
                    onPaste={otp.handlePaste}
                />
            ))}
            <button onClick={() => otp.clear()}>clear</button>
        </div>
    )
}

TestComponent.propTypes = {
    length: PropTypes.number,
    onComplete: PropTypes.func
}

describe('useOtpInputs', () => {
    test('initializes with empty values for given length', () => {
        render(<TestComponent length={6} />)
        for (let i = 0; i < 6; i++) {
            expect(screen.getByTestId(`otp-${i}`)).toHaveValue('')
        }
    })

    test('setValue accepts digits, rejects non-digits, and moves focus forward', () => {
        render(<TestComponent length={4} />)

        const input0 = screen.getByTestId('otp-0')
        const input1 = screen.getByTestId('otp-1')

        // Non-digit is ignored
        fireEvent.change(input0, {target: {value: 'a'}})
        expect(input0).toHaveValue('')

        // Digit is accepted and focus moves to next input
        fireEvent.change(input0, {target: {value: '1'}})
        expect(input0).toHaveValue('1')
        expect(document.activeElement).toBe(input1)

        // The joined code is tracked
        expect(screen.getByTestId('code').textContent).toBe('1')
    })

    test('handleKeyDown backspace on empty moves focus to previous', () => {
        render(<TestComponent length={4} />)

        const input0 = screen.getByTestId('otp-0')
        const input1 = screen.getByTestId('otp-1')

        // Enter values in first two fields
        fireEvent.change(input0, {target: {value: '1'}})
        fireEvent.change(input1, {target: {value: '2'}})
        expect(input1).toHaveValue('2')

        // Clear the second input's value
        fireEvent.change(input1, {target: {value: ''}})
        expect(input1).toHaveValue('')

        // Backspace on empty should move focus to previous input
        fireEvent.keyDown(input1, {key: 'Backspace'})
        expect(document.activeElement).toBe(input0)
    })

    test('handlePaste fills all values, focuses last, and calls onComplete', () => {
        const onComplete = jest.fn()
        render(<TestComponent length={4} onComplete={onComplete} />)

        const input0 = screen.getByTestId('otp-0')

        // JSDOM doesn’t fully implement clipboard events; use fireEvent with a payload
        fireEvent.paste(input0, {
            clipboardData: {
                getData: () => '12ab34'
            }
        })

        expect(screen.getByTestId('otp-0')).toHaveValue('1')
        expect(screen.getByTestId('otp-1')).toHaveValue('2')
        expect(screen.getByTestId('otp-2')).toHaveValue('3')
        expect(screen.getByTestId('otp-3')).toHaveValue('4')
        expect(document.activeElement).toBe(screen.getByTestId('otp-3'))
        expect(onComplete).toHaveBeenCalledWith('1234')
    })

    test('clear resets all values and focuses first input', () => {
        render(<TestComponent length={4} />)

        const input0 = screen.getByTestId('otp-0')
        const input1 = screen.getByTestId('otp-1')

        fireEvent.change(input0, {target: {value: '1'}})
        fireEvent.change(input1, {target: {value: '2'}})
        expect(input0).toHaveValue('1')
        expect(input1).toHaveValue('2')

        fireEvent.click(screen.getByText('clear'))
        for (let i = 0; i < 4; i++) {
            expect(screen.getByTestId(`otp-${i}`)).toHaveValue('')
        }
        expect(document.activeElement).toBe(input0)
    })
})
