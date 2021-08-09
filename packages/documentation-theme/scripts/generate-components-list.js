const fs = require('fs-extra')
const glob = require('glob')
const path = require('path')

const logAndExit = require('./utils.js').logAndExit

const formatComponentName = (component) => {
    const lastSlash = component.lastIndexOf('/')
    const removedDir = component.slice(lastSlash + 1)
    const firstCharRegex = /\b([a-z])/g
    const capitalized = removedDir.replace(firstCharRegex, (x) => x.toUpperCase())

    return capitalized.replace(/-/g, '')
}

const generate = () => {
    const componentList = []
    const componentsPath = path.join('src', 'components')

    if (!fs.pathExistsSync(path.resolve(componentsPath))) {
        return Promise.resolve()
    }

    const folders = glob.sync(path.resolve(`${componentsPath}/*`))

    folders.forEach((folder) => {
        const reactComponents = glob.sync(path.resolve(folder, '*.jsx'))

        if (reactComponents.length === 0) {
            const designComponents = glob.sync(path.resolve(folder, 'DESIGN_README.md'))
            designComponents.forEach((designComponent) => {
                designComponent = designComponent.replace(/\/?DESIGN_README.md/, '')
                componentList.push(formatComponentName(designComponent))
            })
        } else {
            if (glob.sync(path.resolve(folder, 'README.md')).length > 0) {
                reactComponents.forEach((reactComponent) => {
                    reactComponent = reactComponent.replace(/\/?index.jsx/, '')
                    reactComponent = reactComponent.replace('.jsx', '')
                    componentList.push(formatComponentName(reactComponent))
                })
            }
        }
    })

    const componentsJSON = JSON.stringify({
        _excludeFromMenu: true,
        _componentsList: componentList
    })

    return fs
        .writeFile(
            path.join('docs', 'public', 'latest', 'components', '_data.json'),
            componentsJSON
        )
        .then(() => {
            console.log('Successfully generated components JSON data')
        })
        .catch(logAndExit('Failed to generate components list:'))
}

module.exports = generate
