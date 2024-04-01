// NOTE: This loader should only be applied when in develop mode, and there should be a cli option to opt out.
module.exports = function (source) {
    
    // NOTE: This probably isn't how we'll end up doing this in production. What we will want it a template
    // that we can import and apply with provided data (module name, component implementation string, etc)
    //
    // It should provide the following:
    //
    // 1. When a hovered we need to show the components information, including the path to it's implementation,
    //    a link to it's docs in github, description (via jsdoc or something), and a link to eject the code into
    //    the current project.
    // 2. It should visually communicate the boundaries of the component by either adding a border or using a zoom
    //    effect to raise the component.
    // 3. It would be nice to have a separate wrapper/enhancer template to wrap the entire application to allow us to
    //    turn on/off this developer mode so it doesn't get annoying if someone want to see what the project will look
    //    like in production. 
    const componentWrapper = ({moduleName, filePath}) => `
        export default (props) => {
            const [hidden, setHidden] = React.useState(true)
            const [style, setStyle] = React.useState({})

            React.useEffect(() => {
                if (hidden) {
                    setStyle({})
                } else {
                    setStyle({
                        border: '2px solid red',
                        boxSizing: 'border-box',
                        borderRadius: 5
                    })
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
                                    position: 'fixed',
                                    bottom: 0,
                                    left: 0,
                                    backgroundColor: 'lightblue',
                                    border: '1px solid black',
                                    padding: '4px',
                                    margin: '4px',
                                    borderRadius: '4px',
                                    width: 'calc(100% + 8px)',
                                    zIndex: 100000
                                }}
                            >
                                <b>Component Location:</b> ${filePath.replace('/Users/bchypak/Projects/pwa-kit/packages/', '@')} <br/>
                                <a href="/">View Code</a>
                            </div>
                    }
                    
                    <${moduleName} {...props} />
                </div>
            )
        }
    `
    const enhanceSourceWith = (template, data) => template(data)

    // NOTE: For the actual implementation we'll want to have a generic set of rules that we use to wrap our components.
    //
    // There will be some criteria that nees to pass first.
    //
    // 1. The file must be either tsx or jsx
    // 2. It must have a single export.
    // 3. Ideally we know if it's overridable (e.g. it is imported via the wildcard import syntax) (hard)
    const map = {
        ['home.tsx']: 'Home',
        ['account.tsx']: 'Account',
        ['product-detail.tsx']: 'ProductDetail',
        ['product-list.tsx']: 'ProductList',
        ['hello-typescript.tsx']: 'HelloTS',
        ['store-finder.tsx']: 'StoreFinder'
    }

    // Apply some transformations to the source...
    const fileName = this.resourcePath.split('/').pop()
    const moduleName = map[fileName]
    if (moduleName || this.resourcePath.match(/\/(components|pages)\//)) {
        // console.log('FILE NAME: ', this.resourcePath)
        // console.log('MODULE NAME: ', moduleName)
        const match = source.match(/export default ([A-Z]\w+)\n/)
        if (match && ['Refinements', 'Header', 'ProductDetail', 'ProductList', 'ProductTile'].includes(match[1])) {
            source = source.replace(
                /export default ([A-Z]\w+)\n/, 
                enhanceSourceWith(
                    componentWrapper, 
                    {
                        moduleName: moduleName || match[1], 
                        filePath: this.resourcePath
                    }
                )
            )


            console.log('NEW SOURCE: ', source)
        }
    
    }
    return source
}