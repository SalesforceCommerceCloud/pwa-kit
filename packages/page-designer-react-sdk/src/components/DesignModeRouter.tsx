// router/DesignModeRouter.js
import React, {useEffect} from 'react'
import { useDesignMode } from '../context/useDesignMode';

const DesignModeRouter = ({Page, DesignModePage}: {Page: React.ElementType; DesignModePage: React.ElementType}) => {
    const isDesign = useDesignMode()
    
    return isDesign ? <DesignModePage /> : <Page />
}

export default DesignModeRouter
