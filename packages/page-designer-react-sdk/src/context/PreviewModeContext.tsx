import React, {
    createContext,
    useMemo,
    useState,
} from 'react'
import {useLocation} from 'react-router-dom'

type PreviewModeContextType = {
    isPreviewMode: boolean
    setOnMessage: (handler?: (event: MessageEvent) => void) => void
}

export const PreviewModeContext = createContext<PreviewModeContextType | undefined>(undefined)

export const PreviewModeProvider = ({children}: {children: React.ReactNode}) => {
    const location = useLocation()

    const isPreviewMode = useMemo(() => {
        const query = new URLSearchParams(location.search)
        return query.get('preview') === 'true'
    }, [location.search])

    const [_, setOnMessage] = useState<((event: MessageEvent) => void) | undefined>()

    const contextValue = useMemo<PreviewModeContextType>(() => ({
        isPreviewMode,
        setOnMessage
    }), [isPreviewMode])

    return (
        <PreviewModeContext.Provider value={contextValue}>
                {children}
        </PreviewModeContext.Provider>
    )
} 