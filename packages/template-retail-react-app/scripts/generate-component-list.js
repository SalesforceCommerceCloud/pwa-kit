const fs = require('fs')
const path = require('path')

const componentsDir = path.join(
    process.cwd(),
    'packages',
    'template-retail-react-app',
    'app',
    'components'
)
const outputDir = path.join(process.cwd(), 'app', 'build')
const outputFile = path.join(outputDir, 'components.json')

try {
    console.log('Generating component list...')
    const allFiles = fs.readdirSync(componentsDir, {withFileTypes: true})
    const componentList = allFiles
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .filter((name) => !name.startsWith('_') && name !== 'shared')
        .sort()

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true})
    }
    
    fs.writeFileSync(outputFile, JSON.stringify(componentList, null, 2))
    
    console.log(`Successfully generated ${outputFile} with ${componentList.length} components.`)

} catch (e) {
    console.error('Failed to generate component list:', e)
    process.exit(1)
} 