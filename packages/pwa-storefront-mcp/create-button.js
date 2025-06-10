#!/usr/bin/env node

import { AddComponentTool } from './AddComponentTool.js';
import fs from 'fs/promises';
import path from 'path';

async function createButtonComponent() {
  console.log('🔘 Creating PrimaryButton component file...\n');

  try {
    const componentTool = new AddComponentTool();
    
    // Generate the button component
    const componentCode = componentTool.createComponentFile('PrimaryButton', 'button', {
      variant: 'primary',
      size: 'medium',
      styling: 'tailwind'
    });

    // Create components directory if it doesn't exist
    const componentsDir = './src/components';
    await fs.mkdir(componentsDir, { recursive: true });

    // Write the component file
    const fileName = 'PrimaryButton.jsx';
    const filePath = path.join(componentsDir, fileName);
    
    await fs.writeFile(filePath, componentCode, 'utf-8');
    
    console.log(`✅ Created ${filePath}`);
    console.log('\n📂 File structure:');
    console.log('├── src/');
    console.log('│   └── components/');
    console.log('│       └── PrimaryButton.jsx');
    
    console.log('\n📄 Component content:');
    console.log('```jsx');
    console.log(componentCode);
    console.log('```');

    // Also create an index.js for easy imports
    const indexPath = path.join(componentsDir, 'index.js');
    const indexContent = `export { default as PrimaryButton } from './PrimaryButton.jsx';\n`;
    
    try {
      const existingIndex = await fs.readFile(indexPath, 'utf-8');
      if (!existingIndex.includes('PrimaryButton')) {
        await fs.appendFile(indexPath, indexContent);
        console.log('\n✅ Added to components/index.js');
      }
    } catch (error) {
      // File doesn't exist, create it
      await fs.writeFile(indexPath, indexContent, 'utf-8');
      console.log('\n✅ Created components/index.js');
    }

    console.log('\n🎯 Usage example:');
    console.log('```jsx');
    console.log("import { PrimaryButton } from './src/components';");
    console.log('');
    console.log('function App() {');
    console.log('  return (');
    console.log('    <PrimaryButton onClick={() => console.log("Clicked!")}>');
    console.log('      Click me');
    console.log('    </PrimaryButton>');
    console.log('  );');
    console.log('}');
    console.log('```');

  } catch (error) {
    console.error('❌ Error creating component:', error);
  }
}

createButtonComponent().catch(console.error); 