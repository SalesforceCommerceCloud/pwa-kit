module.exports = function (source) {
    
    

    const getNewCode = (moduleName, filePath) => `
        
        export default (props) => {
            const [hidden, setHidden] = React.useState(true)
            const [style, setStyle] = React.useState({})

            React.useEffect(() => {
                if (hidden) {
                    setStyle({})
                } else {
                    setStyle({animation: 'blink 1s linear infinite'})
                }
            }, [hidden])

            return (
                <div
                    onMouseEnter={() => setHidden(false)}
                    onMouseLeave={() => setHidden(true)}
                    style={style}
                >
                    {
                        hidden ? 
                            null : 
                            <div 
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    backgroundColor: 'lightblue',
                                    border: '1px solid black',
                                    padding: '4px',
                                    margin: '4px',
                                    borderRadius: '4px',
                                    width: 'calc(100% + 8px)',
                                    opacity: 0.75
                                }}
                            >
                                <b>Component Location:</b> ${filePath.replace('/Users/bchypak/Projects/pwa-kit/packages/', '@')} <br/>
                                <a href="/">View Code</a>
                            </div>
                    }
                    
                    <${moduleName} {...props}/>
                </div>
            )
        }
    `

    const map = {
        ['home.tsx']: 'Home',
        ['account.tsx']: 'Account',
        ['product-detail.tsx']: 'ProductDetail',
        ['hello-typescript.tsx']: 'HelloTS',
        ['store-finder.tsx']: 'StoreFinder'
    }

    // Apply some transformations to the source...
    const fileName = this.resourcePath.split('/').pop()
    const moduleName = map[fileName]
    if (moduleName) {
        // console.log('RESOURCE PATH:', this.resourcePath)
        // console.log('SOURCE: ', source)
        source = source.replace(/export default ([A-Z]\w+)/, getNewCode(moduleName, this.resourcePath))
        // console.log('NEW SOURCE: ', source)
    }
    return source
}