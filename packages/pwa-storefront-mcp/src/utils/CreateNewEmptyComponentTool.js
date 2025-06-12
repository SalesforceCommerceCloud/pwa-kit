import fs from 'fs/promises';

export class CreateNewEmptyComponentTool {
  /**
   * Create an empty React component file under app/components
   * @param {string} componentName - The name of the component
   * @param {string} [componentsDir='app/components'] - The directory to create the component in
   */
  createEmptyComponent(componentName, componentsDir = '/Users/wei.liu/dev/pwa-generated-project/retail-react-app/app/components') {
    // Ensure the directory exists
    return fs.mkdir(componentsDir, { recursive: true })
      .then(() => {
        const fileName = `${componentName}.jsx`;
        const filePath = path.join(componentsDir, fileName);
        const componentCode = `import React from 'react';

const ${componentName} = () => {
  return (
    <div>${componentName} component</div>
  );
};

export default ${componentName};
`;
        return fs.writeFile(filePath, componentCode, 'utf-8').then(() => `✅ Created ${filePath}`);
      });
  }
}
