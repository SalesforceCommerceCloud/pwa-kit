import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useLocation} from 'react-router-dom'
import {useDesignMode} from '../context'
import {useParentConnection} from './parentConnection'

const getComponentConfigFromElement = (el: HTMLElement) => {
    const typeId = el.closest('[data-component-type]')?.getAttribute('data-component-type')
    // return componentConfigs.find(config => config.id === typeId)
    return {id: 'eb3ba0039c140b78f32810d7b1'}
}

const DROP_REGION_CLASS = 'pd-drop-region'
const DROP_ACTIVE_CLASS = 'pd-drop-active'
const DROP_INDICATOR_ABOVE = 'pd-drop-indicator--above'
const DROP_INDICATOR_BELOW = 'pd-drop-indicator--below'

export const smartComponent = (Component) => {
    const Wrapped = (props: any) => {
        const designModeContext = useDesignMode()
        const isDesign = designModeContext?.isDesignMode
        const location = useLocation()
        const isDesignMode = useMemo(() => {
            const query = new URLSearchParams(location.search)
            return query.get('design') === 'true'
        }, [location.search])
        const ref = useRef<HTMLDivElement>(null)

        const componentId =
            props.componentId || `${Component.displayName || Component.name || 'Component'}`

        // Drag state
        const [dragActive, setDragActive] = useState(false)
        const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null)

        // Listen for drag state from parent
        const onMessage = useCallback((event: MessageEvent) => {
            console.log('PWA', event.data)
            if (event.data?.mType === 'builder-drag-state') {
                setDragActive(!!event.data.mBody?.active)
            }
        }, [])

        const {sendMessage} = useParentConnection(isDesignMode, onMessage)

        // Drop indicator logic
        const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
            if (!dragActive) return
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
            const y = e.clientY - rect.top
            if (y < rect.height / 2) {
                setDropPosition('above')
            } else {
                setDropPosition('below')
            }
        }

        const handleMouseLeave = () => {
            setDropPosition(null)
        }

        const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
            if (!isDesign) return

            // Prevent bubbling if needed
            e.preventDefault()
            e.stopPropagation()

            // Remove selection from previous component
            const prev = document.querySelector('.pd-smart-component.pd-selected')
            if (prev && prev !== e.currentTarget) {
                prev.classList.remove('pd-selected')
            }

            // Toggle selected class
            e.currentTarget.classList.add('pd-selected')

            const target = e.target as HTMLElement
            const config = getComponentConfigFromElement(target)
            sendMessage('builder-component-selected', config)
        }

        const handleHover = (e: React.MouseEvent<HTMLDivElement>) => {
            const target = e.target as HTMLElement
            const config = getComponentConfigFromElement(target)
            sendMessage('builder-component-highlighted', config)
        }

        useEffect(() => {
            if (!isDesignMode) return

            const handleClickOutside = (e: MouseEvent) => {
                const wrapper = document.querySelector('.pd-smart-component.pd-selected')
                if (wrapper && !wrapper.contains(e.target as Node)) {
                    wrapper.classList.remove('pd-selected')
                }
            }

            document.addEventListener('click', handleClickOutside)

            return () => {
                document.removeEventListener('click', handleClickOutside)
            }
        }, [isDesignMode, sendMessage])

        return (
            <div
                ref={ref}
                className={`pd-smart-component ${DROP_REGION_CLASS} ${
                    dragActive ? DROP_ACTIVE_CLASS : ''
                } ${dropPosition === 'above' ? DROP_INDICATOR_ABOVE : ''} ${
                    dropPosition === 'below' ? DROP_INDICATOR_BELOW : ''
                }`}
                onClick={handleClick}
                onMouseOver={handleHover}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
                data-component-id={componentId}
            >
                {/* Drop indicator line */}
                {dragActive && dropPosition === 'above' && (
                    <div className="pd-drop-line pd-drop-line--above" />
                )}
                {dragActive && dropPosition === 'below' && (
                    <div className="pd-drop-line pd-drop-line--below" />
                )}
                <Component {...props} />
            </div>
        )
    }
    return Wrapped
}
