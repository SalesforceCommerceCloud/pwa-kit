/**
 * This script is used to create a LLM instruction file for a given extension.
 * @author kzheng
 * @since 260
 */
const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const pluginConfig = require('../assets/plugin-config')

// The root directory of the template-chakra-storefront folder.
const TEMPLATE_CHAKRA_STOREFRONT_DIR = path.join(__dirname, '../../template-chakra-storefront')
// The relative path of the template-chakra-storefront folder from the root of the monorepo
const REL_CHAKRA_STOREFRONT_DIR = 'packages/template-chakra-storefront/'
// The directories to skip when searching for files to merge
const SKIP_DIRS = ['node_modules', 'dist', 'build']
const INSTALL_INSTRUCTIONS_TEMPLATE = 'install-instructions.mdc.hbs'
const UNINSTALL_INSTRUCTIONS_TEMPLATE = 'uninstall-instructions.mdc.hbs'

/**
 * Build the context for the instructions template.
 * @param {string} markerValue The marker value of the extension, e.g., SFDC_EXT_STORE_LOCATOR
 * @param {string} pwaRepo The repository URL of the pwa-kit repo, e.g., https://github.com/SalesforceCommerceCloud/pwa-kit.git
 * @param {string} branch The branch of the pwa-kit repo, e.g., main
 * @param {string[]} filesToCopy The relative paths of files or directories to copy from the pwa-kit repo to the current project, e.g., ['src/pages/store-locator']
 * @returns 
 */
const getContext = (markerValue, pwaRepo = 'https://github.com/SalesforceCommerceCloud/pwa-kit.git', branch = 'main', filesToCopy = []) => {
    if (!pluginConfig.plugins[markerValue]) {
        throw new Error(`Extension ${markerValue} not found in plugin config`)
    }
    filesToCopy.forEach(file => {
        const fullPath = path.join(TEMPLATE_CHAKRA_STOREFRONT_DIR, file)
        if (!fs.existsSync(fullPath)) {
            throw new Error(`File or directory ${fullPath} not found`)
        }
    })    
    const context = {
        extensionName: pluginConfig.plugins[markerValue].name,
        pwaRepo,
        branch,
        markerValue,
        mergeFiles: findMergeFiles(markerValue),
        copy: getFilesToCopyContext(filesToCopy),
        delete: filesToCopy
    }
    return context
}

/**
 * Get the context for the files to copy.
 * @param {string[]} filesToCopy The relative paths of files or directories to copy from the pwa-kit repo to the current project, e.g., ['src/pages/store-locator']
 * @returns {Object[]} The context for the files to copy, e.g., [{src: 'packages/template-chakra-storefront/src/pages/store-locator', dest: 'src/pages/store-locator'}]
 */
const getFilesToCopyContext = (filesToCopy) => {
    filesToCopy.forEach(file => {
        const fullPath = path.join(TEMPLATE_CHAKRA_STOREFRONT_DIR, file)
        if (!fs.existsSync(fullPath)) {
            throw new Error(`File or directory ${fullPath} not found`)
        }
    })
    return filesToCopy.map(file => ({
        src: path.join(REL_CHAKRA_STOREFRONT_DIR, file),
        dest: file
    }))
}

/**
 * Find all the files that contain the marker value in the template-chakra-storefront folder.
 * @param {string} markerValue 
 * @returns 
 */
const findMergeFiles = (markerValue) => {
    const fileTypes = ['jsx', 'tsx', 'ts', 'js']
    const mergeFiles = []
    const lineRegex = new RegExp(`@sfdc-extension-line\\s+${markerValue}`)
    const blockStartRegex = new RegExp(`@sfdc-extension-block-start\\s+${markerValue}`)
    const blockEndRegex = new RegExp(`@sfdc-extension-block-end\\s+${markerValue}`)
    const searchFiles = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            if (entry.isDirectory() && !SKIP_DIRS.includes(entry.name)) {
                searchFiles(fullPath)
            } else if (
                entry.isFile() &&
                fileTypes.some((ext) => fullPath.endsWith('.' + ext))
            ) {
                const content = fs.readFileSync(fullPath, 'utf8')
                if (lineRegex.test(content) || blockStartRegex.test(content) || blockEndRegex.test(content)) {
                    // Store relative path from rootDir
                    mergeFiles.push(path.relative(TEMPLATE_CHAKRA_STOREFRONT_DIR, fullPath))
                }
            }
        }
    }
    searchFiles(TEMPLATE_CHAKRA_STOREFRONT_DIR)
    console.log(`Found ${mergeFiles.length} files to merge for marker value ${markerValue}:`)
    console.log(mergeFiles.join('\n'))
    return mergeFiles
}

/**
 * Generate the MDC instructions file based on user inputs.
 * @param {string} markerValue 
 * @param {string} pwaRepo optional, default is https://github.com/SalesforceCommerceCloud/pwa-kit.git
 * @param {string} branch optional, default is main
 * @param {string[]} filesToCopy 
 */
const generateInstructions = (markerValue, pwaRepo, branch, filesToCopy) => {
    const context = getContext(markerValue, pwaRepo, branch, filesToCopy)
    // Ensure the @instructions directory exists
    const instructionsDir = path.join(__dirname, '../instructions')
    if (!fs.existsSync(instructionsDir)) {
        fs.mkdirSync(instructionsDir)
    }
    // Generate the install instructions
    genertaeAndWriteInstructions(INSTALL_INSTRUCTIONS_TEMPLATE, context, path.join(instructionsDir, `install-${context.extensionName.toLowerCase().replace(/ /g, '-')}.mdc`))
    // Generate the uninstall instructions
    genertaeAndWriteInstructions(UNINSTALL_INSTRUCTIONS_TEMPLATE, context, path.join(instructionsDir, `uninstall-${context.extensionName.toLowerCase().replace(/ /g, '-')}.mdc`))
}

/**
 * Generate the MDC instructions file based on the template file and context.
 * @param {string} templateFile 
 * @param {Object} context 
 * @param {string} outputFile 
 */
const genertaeAndWriteInstructions = (templateFile, context, outputFile) => {
    const templatePath = path.join(__dirname, templateFile)
    const templateContent = fs.readFileSync(templatePath, 'utf8')
    const template = Handlebars.compile(templateContent)
    const mdcContent = template(context)
    fs.writeFileSync(outputFile, mdcContent, 'utf8')
    console.log(`MDC instructions written to ${outputFile}`)
}

// Parse named arguments from the command line, e.g. markerValue=SFDC_EXT_STORE_LOCATOR
const argMap = {}
for (const arg of process.argv.slice(2)) {
    const [key, ...rest] = arg.split('=')
    if (key && rest.length > 0) {
        argMap[key] = rest.join('=')
    }
}

const markerValue = argMap.markerValue
const pwaRepo = argMap.pwaRepo
const branch = argMap.branch
const filesToCopyRaw = argMap.filesToCopy

if (!markerValue) {
    console.error('Usage: node create-instructions.js markerValue=SFDC_EXT_STORE_LOCATOR [pwaRepo=https://github.com/SalesforceCommerceCloud/pwa-kit.git] [branch=main] [filesToCopy=src/plugins/store-locator/index.js,src/plugins/store-locator/utils.js]')
    process.exit(1)
}

const filesToCopy = filesToCopyRaw ? filesToCopyRaw.split(',') : []
generateInstructions(markerValue, pwaRepo, branch, filesToCopy)


