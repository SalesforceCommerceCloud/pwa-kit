import React from 'react'
import {render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {PreviewModeProvider, usePreviewMode} from '../PreviewModeContext'

const TestComponent = () => {
    const previewMode = usePreviewMode()
    return (
        <div>
            <span data-testid="preview-mode">
                {previewMode?.isPreviewMode ? 'active' : 'inactive'}
            </span>
        </div>
    )
}

describe('PreviewModeContext', () => {
    it('should detect preview mode from URL parameter', () => {
        render(
            <MemoryRouter initialEntries={['/?preview=true']}>
                <PreviewModeProvider>
                    <TestComponent />
                </PreviewModeProvider>
            </MemoryRouter>
        )

        expect(screen.getByTestId('preview-mode')).toHaveTextContent('active')
    })

    it('should be inactive when preview parameter is not present', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <PreviewModeProvider>
                    <TestComponent />
                </PreviewModeProvider>
            </MemoryRouter>
        )

        expect(screen.getByTestId('preview-mode')).toHaveTextContent('inactive')
    })

    it('should be inactive when preview parameter is false', () => {
        render(
            <MemoryRouter initialEntries={['/?preview=false']}>
                <PreviewModeProvider>
                    <TestComponent />
                </PreviewModeProvider>
            </MemoryRouter>
        )

        expect(screen.getByTestId('preview-mode')).toHaveTextContent('inactive')
    })
}) 