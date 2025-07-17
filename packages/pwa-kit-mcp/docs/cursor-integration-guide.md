# How to Programmatically Insert Code Blocks in Cursor

This guide shows different methods to programmatically insert code blocks in files using Cursor.

## Method 1: Using Your MCP Server (Recommended)

### Setup
1. **Configure the MCP Server in Cursor.**
   ```json
   // Add to your Cursor MCP configuration
   {
     "mcpServers": {
       "pwa-kit-mcp": {
         "command": "node",
         "args": ["pwa-kit-mcp/server.js"]
       }
     }
   }
   ```

2. **Restart Cursor** to load the MCP server.

### Using the Tools

#### 1. Analyze Code Structure
```javascript
// Ask Cursor/Claude: "Analyze this React code structure"
// The MCP server will identify:
// - Import statements
// - Component definitions
// - Export statements
// - Insertion points
// - Framework detection (React, Next.js)
// - Styling system detection (Tailwind, CSS)
```

#### 2. Insert React Components
```javascript
// Ask Cursor/Claude: "Insert a ProductCard component with Tailwind styling"
// The MCP server will:
// - Analyze the existing code
// - Generate the appropriate component
// - Find the best insertion point
// - Add necessary imports
// - Insert the component code
```

#### 3. Create New Component Files
```javascript
// Ask Cursor/Claude: "Create a new Button component file"
// The MCP server will generate a complete component file with:
// - Proper imports
// - Component definition
// - Export statement
// - Styling (Tailwind or CSS)
```

## Method 2: Direct File Manipulation

### Using Node.js Scripts
```javascript
import fs from 'fs/promises';
import path from 'path';

async function insertCodeBlock(filePath, codeBlock, insertionPoint = 'end') {
  try {
    // Read existing file
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    let insertIndex;
    
    switch (insertionPoint) {
      case 'start':
        insertIndex = 0;
        break;
      case 'end':
        insertIndex = lines.length;
        break;
      case 'after-imports':
        // Find last import statement
        insertIndex = findLastImportLine(lines) + 1;
        break;
      case 'before-export':
        // Find export default statement
        insertIndex = findExportDefaultLine(lines);
        break;
      default:
        insertIndex = lines.length;
    }
    
    // Insert the code block
    lines.splice(insertIndex, 0, '', codeBlock, '');
    
    // Write back to file
    await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
    console.log(`✅ Code inserted into ${filePath}`);
    
  } catch (error) {
    console.error('❌ Error inserting code:', error);
  }
}

function findLastImportLine(lines) {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim().startsWith('import ')) {
      return i;
    }
  }
  return 0;
}

function findExportDefaultLine(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('export default')) {
      return i;
    }
  }
  return lines.length;
}

// Usage
await insertCodeBlock(
  './src/App.js',
  `const NewComponent = () => {
  return <div>Hello World</div>;
};`,
  'after-imports'
);
```

### Using the fs module with templates
```javascript
import fs from 'fs/promises';
import { AddComponentTool } from './AddComponentTool.js';

const componentTool = new AddComponentTool();

async function insertReactComponent(filePath, componentType, options) {
  try {
    // Read existing file
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Use our MCP tool to insert the component
    const modifiedCode = componentTool.insertComponent(content, componentType, options);
    
    // Write back to file
    await fs.writeFile(filePath, modifiedCode, 'utf-8');
    console.log(`✅ ${componentType} component inserted into ${filePath}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Usage
await insertReactComponent('./src/App.js', 'button', {
  name: 'SubmitButton',
  variant: 'primary',
  styling: 'tailwind'
});
```

## Method 3: Using Cursor's AI Commands

### 1. **Natural Language Commands:**
```
"Insert a ProductCard component after the imports in App.js"
"Add a modal component with Tailwind styling to this file"
"Create a new button component with these specifications: primary variant, medium size"
```

### 2. **Structured Prompts:**
```
Insert a React component with these specifications.
- Type: ProductCard
- Name: FeaturedProduct
- Styling: Tailwind CSS
- Features: Show price, rating, and add-to-cart button
- Insert after imports in the current file
```

### 3. **Code Generation Prompts:**
```
Generate and insert a complete React component.

```typescript
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    rating?: number;
  };
  onAddToCart: (product: Product) => void;
}
```

Create a ProductCard component using this interface.
```

## Method 4: VSCode/Cursor Extensions

### Custom Extension for Code Insertion
```javascript
// extension.js
const vscode = require('vscode');

function activate(context) {
  let disposable = vscode.commands.registerCommand('extension.insertComponent', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    // Get component type from user
    const componentType = await vscode.window.showQuickPick([
      'button', 'card', 'modal', 'product', 'form'
    ], { placeHolder: 'Select component type' });
    
    if (!componentType) return;
    
    // Generate component code using your MCP server
    const componentCode = await generateComponent(componentType);
    
    // Find insertion point
    const insertionPoint = findInsertionPoint(editor.document);
    
    // Insert the code
    editor.edit(editBuilder => {
      editBuilder.insert(insertionPoint, `\n${componentCode}\n`);
    });
  });
  
  context.subscriptions.push(disposable);
}

async function generateComponent(type) {
  // Call your MCP server or use the AddComponentTool directly
  const { AddComponentTool } = await import('./AddComponentTool.js');
  const tool = new AddComponentTool();
  
  return tool.createComponentFile(
    `Custom${type.charAt(0).toUpperCase() + type.slice(1)}`,
    type,
    { styling: 'tailwind' }
  );
}
```

## Method 5: Automation Scripts

### Batch Component Generation
```javascript
import { AddComponentTool } from './AddComponentTool.js';
import fs from 'fs/promises';
import path from 'path';

const componentTool = new AddComponentTool();

const componentsToCreate = [
  { name: 'ProductCard', type: 'product', options: { styling: 'tailwind' } },
  { name: 'AddToCartButton', type: 'button', options: { variant: 'primary' } },
  { name: 'ProductModal', type: 'modal', options: { closeOnOverlay: true } },
  { name: 'ReviewCard', type: 'card', options: { showHeader: true } }
];

async function generateComponents() {
  const componentsDir = './src/components';
  
  // Ensure directory exists
  await fs.mkdir(componentsDir, { recursive: true });
  
  for (const comp of componentsToCreate) {
    const componentCode = componentTool.createComponentFile(
      comp.name,
      comp.type,
      comp.options
    );
    
    const fileName = `${comp.name}.jsx`;
    const filePath = path.join(componentsDir, fileName);
    
    await fs.writeFile(filePath, componentCode, 'utf-8');
    console.log(`✅ Created ${fileName}`);
  }
}

generateComponents().catch(console.error);
```

## Best Practices

1. **Use the MCP Server**: The MCP server provides intelligent analysis and proper code insertion.
2. **Validate Syntax**: Always check generated code for syntax errors.
3. **Preserve Formatting**: Maintain consistent code style and indentation.
4. **Handle Imports**: Ensure necessary imports are added when inserting components.
5. **Test Integration**: Verify that inserted components work with existing code.

## Demo Commands

Run the demo to see the MCP server in action:
```bash
npm run demo  # or: node demo.js
```

This demo demonstrates the following:
- Code structure analysis
- Component insertion
- New file creation
- Real-time code generation 