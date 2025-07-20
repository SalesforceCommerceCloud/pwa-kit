import React, {
    createContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {useLocation} from 'react-router-dom'
import {componentConfigs} from '../ComponentRegistry'
import {PD, setupComponentRegistryMessaging} from '../core/registry'
import {DESIGN_MODE_CSS} from './design-mode'

type DesignModeContextType = {
    isDesignMode: boolean
    setOnMessage: (handler?: (event: MessageEvent) => void) => void
}

export const DesignModeContext = createContext<DesignModeContextType | undefined>(undefined)

export const DesignModeProvider = ({children}: {children: React.ReactNode}) => {
    const location = useLocation()

    const isDesignMode = useMemo(() => {
        const query = new URLSearchParams(location.search)
        return query.get('design') === 'true'
    }, [location.search])

    const [_, setOnMessage] = useState<((event: MessageEvent) => void) | undefined>()

    useEffect(() => {
        if (!isDesignMode) return

        const styleEl = document.createElement('style')
        styleEl.setAttribute('data-pd-style', 'true')
        styleEl.textContent = DESIGN_MODE_CSS
        document.head.appendChild(styleEl)

        setupComponentRegistryMessaging()
        // componentConfigs.forEach(PD.registerComponent)

        return () => {
            document.querySelector('[data-pd-style]')?.remove()
        }
    }, [isDesignMode])

    const contextValue = useMemo<DesignModeContextType>(() => ({
        isDesignMode,
        setOnMessage
    }), [isDesignMode])

    return (
        <DesignModeContext.Provider value={contextValue}>
                {children}
        </DesignModeContext.Provider>
    )
}
