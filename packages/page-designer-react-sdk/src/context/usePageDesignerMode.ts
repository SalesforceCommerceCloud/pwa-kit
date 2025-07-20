import {useContext} from 'react'
import {DesignModeContext} from './DesignModeContext'
import {PreviewModeContext} from './PreviewModeContext'

export const usePageDesignerMode = () => {
    const designModeContext = useContext(DesignModeContext)
    const previewModeContext = useContext(PreviewModeContext)

    return {
        isDesignMode: designModeContext?.isDesignMode || false,
        isPreviewMode: previewModeContext?.isPreviewMode || false,
        isAnyModeActive: (designModeContext?.isDesignMode || false) || (previewModeContext?.isPreviewMode || false)
    }
} 