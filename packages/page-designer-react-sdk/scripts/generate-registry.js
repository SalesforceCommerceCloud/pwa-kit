// scripts/generateRegistry.ts
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import reactDocgen from 'react-docgen';

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(
    ROOT,
    'packages/page-designer-react-sdk/src/componentRegistry.ts'
);

// Include all .tsx files in all packages except node_modules
const files = glob.sync('packages/**/src/**/*.tsx', {
    cwd: ROOT,
    absolute: true,
    ignore: ['**/node_modules/**']
});

const imports: string[] = [];
const registrations: string[] = [];

files.forEach((filePath) => {
    const code = fs.readFileSync(filePath, 'utf8');

    if (!code.includes('smartComponent(')) return;

    try {
        const parsed = reactDocgen.parse(code);
        const { displayName, props } = parsed;

        const componentName = displayName || path.basename(filePath, '.tsx');

        // Create relative import path from the SDK package
        const importPath = path.relative(
            path.join(ROOT, 'packages/page-designer-react-sdk/src'),
            filePath.replace(/\.tsx$/, '')
        ).replace(/\\/g, '/'); // normalize windows paths

        imports.push(`import ${componentName} from '${importPath}';`);

        const inputs = Object.entries(props || {}).map(([name, prop]: any) => {
            const type = prop.type?.name || 'text';
            return `{ name: "${name}", type: "${type}" }`;
        });

        registrations.push(
            `PD.registerComponent(${componentName}, {
  name: "${componentName}",
  inputs: [${inputs.join(', ')}],
  canHaveChildren: false
});`
        );
    } catch (err) {
        console.warn(`⚠️ Could not parse ${filePath}: ${err.message}`);
    }
});

const output = `import { PD } from './pd';\n${imports.join('\n')}\n\n${registrations.join('\n')}\n`;

fs.writeFileSync(OUTPUT_FILE, output);
console.log(`✅ Generated componentRegistry.ts with ${registrations.length} components.`);
