#!/usr/bin/env node

/**
 * Theming MCP Tool for PWA Kit
 * This tool provides theming functionality that can be integrated with GitHub MCP server
 */

const fs = require('fs').promises
const path = require('path')
const { glob } = require('glob')

// Define our theming tool
const themingTool = {
    name: 'theming_tool',
    description: 'Tool for managing component themes and styling in PWA Kit',
    inputSchema: {
        type: 'object',
        properties: {
            operation: {
                type: 'string',
                enum: [
                    'analyze_component_theme',
                    'update_component_background',
                    'update_component_color',
                    'update_component_spacing',
                    'create_theme_variant',
                    'list_theme_files',
                    'get_component_theme_info'
                ],
                description: 'The theming operation to perform'
            },
            component_path: {
                type: 'string',
                description: 'Path to the component file to modify'
            },
            background_color: {
                type: 'string',
                description: 'New background color (hex, rgb, or theme token)'
            },
            text_color: {
                type: 'string',
                description: 'New text color (hex, rgb, or theme token)'
            },
            spacing: {
                type: 'string',
                description: 'New spacing value (px, rem, or theme token)'
            },
            theme_variant: {
                type: 'string',
                description: 'Name of the new theme variant to create'
            },
            theme_config: {
                type: 'object',
                description: 'Theme configuration object'
            }
        },
        required: ['operation']
    }
}

// Helper function to detect theme system
async function detectThemeSystem(componentPath) {
    try {
        const content = await fs.readFile(componentPath, 'utf8')
        
        if (content.includes('@salesforce/retail-react-app/app/components/shared/ui')) {
            return 'chakra-ui'
        } else if (content.includes('styled-components') || content.includes('styled(')) {
            return 'styled-components'
        } else if (content.includes('className') && content.includes('css')) {
            return 'css-modules'
        } else if (content.includes('useTheme') || content.includes('ThemeProvider')) {
            return 'custom-theme'
        }
        
        return 'unknown'
    } catch (error) {
        return 'unknown'
    }
}

// Helper function to find theme files
async function findThemeFiles(projectRoot) {
    const themePatterns = [
        '**/theme.js',
        '**/theme.ts',
        '**/themes/**/*.js',
        '**/themes/**/*.ts',
        '**/styles/**/*.js',
        '**/styles/**/*.ts',
        '**/components/shared/ui/**/*.js',
        '**/components/shared/ui/**/*.ts'
    ]
    
    const themeFiles = []
    for (const pattern of themePatterns) {
        const files = await glob(pattern, { cwd: projectRoot })
        themeFiles.push(...files)
    }
    
    return [...new Set(themeFiles)]
}

// Helper function to update Chakra UI component
async function updateChakraComponent(componentPath, updates) {
    try {
        let content = await fs.readFile(componentPath, 'utf8')
        
        // Update background color
        if (updates.background_color) {
            const bgRegex = /(bg|backgroundColor|bgColor)\s*=\s*["'][^"']*["']/g
            content = content.replace(bgRegex, `$1="${updates.background_color}"`)
        }
        
        // Update text color
        if (updates.text_color) {
            const colorRegex = /(color|textColor)\s*=\s*["'][^"']*["']/g
            content = content.replace(colorRegex, `$1="${updates.text_color}"`)
        }
        
        // Update spacing
        if (updates.spacing) {
            const spacingRegex = /(p|padding|m|margin|gap|spacing)\s*=\s*["'][^"']*["']/g
            content = content.replace(spacingRegex, `$1="${updates.spacing}"`)
        }
        
        await fs.writeFile(componentPath, content, 'utf8')
        return { success: true, message: 'Component updated successfully' }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Tool handler function
async function handleThemingTool(params) {
    console.error('🎨 THEMING TOOL CALLED:', JSON.stringify(params, null, 2))
    
    const { 
        operation, 
        component_path, 
        background_color, 
        text_color, 
        spacing, 
        theme_variant, 
        theme_config 
    } = params
    
    const projectRoot = path.resolve(__dirname, '../../..')
    
    try {
        switch (operation) {
            case 'analyze_component_theme':
                if (!component_path) {
                    throw new Error('component_path is required for analyze_component_theme')
                }
                
                const fullComponentPath = path.resolve(projectRoot, component_path)
                const themeSystem = await detectThemeSystem(fullComponentPath)
                const content = await fs.readFile(fullComponentPath, 'utf8')
                
                // Extract theme-related properties
                const themeProps = {
                    background: content.match(/(bg|backgroundColor|bgColor)\s*=\s*["']([^"']*)["']/g) || [],
                    colors: content.match(/(color|textColor)\s*=\s*["']([^"']*)["']/g) || [],
                    spacing: content.match(/(p|padding|m|margin|gap|spacing)\s*=\s*["']([^"']*)["']/g) || []
                }
                
                return {
                    component_path,
                    theme_system: themeSystem,
                    theme_properties: themeProps,
                    file_size: content.length,
                    last_modified: (await fs.stat(fullComponentPath)).mtime
                }
                
            case 'update_component_background':
                if (!component_path || !background_color) {
                    throw new Error('component_path and background_color are required')
                }
                
                const fullBgPath = path.resolve(projectRoot, component_path)
                const bgResult = await updateChakraComponent(fullBgPath, { background_color })
                return {
                    operation: 'update_component_background',
                    component_path,
                    background_color,
                    result: bgResult
                }
                
            case 'update_component_color':
                if (!component_path || !text_color) {
                    throw new Error('component_path and text_color are required')
                }
                
                const fullColorPath = path.resolve(projectRoot, component_path)
                const colorResult = await updateChakraComponent(fullColorPath, { text_color })
                return {
                    operation: 'update_component_color',
                    component_path,
                    text_color,
                    result: colorResult
                }
                
            case 'update_component_spacing':
                if (!component_path || !spacing) {
                    throw new Error('component_path and spacing are required')
                }
                
                const fullSpacingPath = path.resolve(projectRoot, component_path)
                const spacingResult = await updateChakraComponent(fullSpacingPath, { spacing })
                return {
                    operation: 'update_component_spacing',
                    component_path,
                    spacing,
                    result: spacingResult
                }
                
            case 'list_theme_files':
                const themeFiles = await findThemeFiles(projectRoot)
                return {
                    operation: 'list_theme_files',
                    theme_files: themeFiles,
                    count: themeFiles.length
                }
                
            case 'get_component_theme_info':
                if (!component_path) {
                    throw new Error('component_path is required')
                }
                
                const fullInfoPath = path.resolve(projectRoot, component_path)
                const themeSystemInfo = await detectThemeSystem(fullInfoPath)
                const contentInfo = await fs.readFile(fullInfoPath, 'utf8')
                
                const themePropsInfo = {
                    background: contentInfo.match(/(bg|backgroundColor|bgColor)\s*=\s*["']([^"']*)["']/g) || [],
                    colors: contentInfo.match(/(color|textColor)\s*=\s*["']([^"']*)["']/g) || [],
                    spacing: contentInfo.match(/(p|padding|m|margin|gap|spacing)\s*=\s*["']([^"']*)["']/g) || []
                }
                
                return {
                    operation: 'get_component_theme_info',
                    component_path,
                    theme_system: themeSystemInfo,
                    theme_properties: themePropsInfo,
                    file_size: contentInfo.length,
                    last_modified: (await fs.stat(fullInfoPath)).mtime
                }
                
            case 'create_theme_variant':
                if (!theme_variant || !theme_config) {
                    throw new Error('theme_variant and theme_config are required')
                }
                
                // Create a new theme variant file
                const variantPath = path.join(projectRoot, 'app/themes', `${theme_variant}.js`)
                const variantContent = `export const ${theme_variant} = ${JSON.stringify(theme_config, null, 2)}`
                
                await fs.writeFile(variantPath, variantContent, 'utf8')
                return {
                    operation: 'create_theme_variant',
                    theme_variant,
                    file_path: variantPath,
                    success: true
                }
                
            default:
                throw new Error(`Unknown operation: ${operation}`)
        }
    } catch (error) {
        return {
            success: false,
            error: error.message,
            operation
        }
    }
}

module.exports = {
    themingTool,
    handleThemingTool
}
