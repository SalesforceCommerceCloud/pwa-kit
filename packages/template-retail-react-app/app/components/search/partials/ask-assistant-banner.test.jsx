/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import AskAssistantBanner from '@salesforce/retail-react-app/app/components/search/partials/ask-assistant-banner'

const baseStyles = {
    askAssistantBanner: {},
    askAssistantBannerContent: {},
    askAssistantBannerTitleRow: {},
    askAssistantBannerIcon: {},
    askAssistantBannerTitle: {},
    askAssistantBannerDescription: {},
    askAssistantBannerArrow: {}
}

test('renders Ask Shopping Agent banner with title and description', () => {
    renderWithProviders(<AskAssistantBanner onClick={jest.fn()} styles={baseStyles} />)

    expect(
        screen.getByRole('button', {
            name: /Ask Shopping Agent.*discover, compare,? and shop smarter/i
        })
    ).toBeInTheDocument()
    expect(screen.getByText((content) => content === 'Ask Shopping Agent')).toBeInTheDocument()
    expect(
        screen.getByText(/Discover, compare, and shop smarter with your personal Shopping Agent/i)
    ).toBeInTheDocument()
})

test('calls onClick when banner is clicked', async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()

    renderWithProviders(<AskAssistantBanner onClick={onClick} styles={baseStyles} />)

    const button = screen.getByRole('button', {
        name: /Ask Shopping Agent.*discover, compare,? and shop smarter/i
    })
    await user.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
})
