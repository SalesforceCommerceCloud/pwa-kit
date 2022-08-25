import React from 'react'

// this doesn't work!!
// main.css is generated but
// not referenced anywhere so browser doesn't fetch main.css
import '@fontsource/manrope/800.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/400.css'

const App = (props) => {
    return <div>{props.children}</div>
}

export default App
