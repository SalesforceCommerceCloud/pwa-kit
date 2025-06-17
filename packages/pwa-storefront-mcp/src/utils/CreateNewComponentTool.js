import fs from 'fs/promises';
import path from 'path';

export class CreateNewComponentTool {
  /**
   * Create a React component file under app/components
   * @param {string} componentName - The name of the component
   * @param {string} [componentCode] - The code to use for the component (optional)
   * @param {string} [componentsDir='/Users/wei.liu/dev/pwa-generated-project/retail-react-app/app/components'] - The directory to create the component in
   */
createNewComponent(componentName, code, projectDir = '/Users/wei.liu/dev/git-repos/pwa-kit/packages/template-retail-react-app') {
    const componentDir = path.join(projectDir, "/app/components", componentName);
    return fs.mkdir(componentDir, { recursive: true })
      .then(() => {
        const filePath = path.join(componentDir, 'index.jsx');
        const codeToWrite = code
          ? code
          : `import React from 'react';

const ${componentName} = () => {
  return (
    <div>${componentName} component</div>
  );
};

export default ${componentName};
`;
        return fs.writeFile(filePath, codeToWrite, 'utf-8').then(() => `✅ Created ${filePath}`);
      });
  }
}
