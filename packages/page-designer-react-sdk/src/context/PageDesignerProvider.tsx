import React from 'react'
import {DesignModeProvider} from './DesignModeContext'
import {PreviewModeProvider} from './PreviewModeContext'

type PageDesignerProviderProps = {
    children: React.ReactNode
}

export const PageDesignerProvider = ({children}: PageDesignerProviderProps) => {
    return (
        <DesignModeProvider>
            <PreviewModeProvider>
                {children}
            </PreviewModeProvider>
        </DesignModeProvider>
    )
} 