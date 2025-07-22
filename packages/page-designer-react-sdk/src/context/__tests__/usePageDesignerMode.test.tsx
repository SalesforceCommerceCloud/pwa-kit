import React from 'react'
import {render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {PageDesignerProvider, usePageDesignerMode} from '../usePageDesignerMode'

const TestComponent = () => {
    const {isDesignMode, isPreviewMode, isAnyModeActive} = usePageDesignerMode()
    return (
        <div>
            <span data-testid="design-mode">
                {isDesignMode ? 'active' : 'inactive'}
            </span>
            <span data-testid="preview-mode">
                {isPreviewMode ? 'active' : 'inactive'}
            </span>
            <span data-testid="any-mode">
                {isAnyModeActive ? 'active' : 'inactive'}
            </span>
        </div>
    )
}

describe('usePageDesignerMode', () => {
    it('should detect design mode only', () => {
        render(
            <MemoryRouter initialEntries={['/?design=true']}>
                <PageDesignerProvider>
                    <TestComponent />
                </PageDesignerProvider>
            </MemoryRouter>
        )

        expect(screen.getByTestId('design-mode')).toHaveTextContent('active')
        expect(screen.getByTestId('preview-mode')).toHaveTextContent('inactive')
        expect(screen.getByTestId('any-mode')).toHaveTextContent('active')
    })

    it('should detect preview mode only', () => {
        render(
            <MemoryRouter initialEntries={['/?preview=true']}>
                <PageDesignerProvider>
                    <TestComponent />
                </PageDesignerProvider>
            </MemoryRouter>
        )

        expect(screen.getByTestId('design-mode')).toHaveTextContent('inactive')
        expect(screen.getByTestId('preview-mode')).toHaveTextContent('active')
        expect(screen.getByTestId('any-mode')).toHaveTextContent('active')
    })

    it('should detect both modes', () => {
        render(
            <MemoryRouter initialEntries={['/?design=true&preview=true']}>
                <PageDesignerProvider>
                    <TestComponent />
                </PageDesignerProvider>
            </MemoryRouter>
        )

        expect(screen.getByTestId('design-mode')).toHaveTextContent('active')
        expect(screen.getByTestId('preview-mode')).toHaveTextContent('active')
        expect(screen.getByTestId('any-mode')).toHaveTextContent('active')
    })

    it('should detect no modes', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <PageDesignerProvider>
                    <TestComponent />
                </PageDesignerProvider>
            </MemoryRouter>
        )

        expect(screen.getByTestId('design-mode')).toHaveTextContent('inactive')
        expect(screen.getByTestId('preview-mode')).toHaveTextContent('inactive')
        expect(screen.getByTestId('any-mode')).toHaveTextContent('inactive')
    })
}) 