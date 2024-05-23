const resolve = require('resolve/sync')

function transformImport(nodePath, state) {
    if (!nodePath?.node?.source?.value?.startsWith('*') || !nodePath?.node?.source?.value?.includes('customize-app')) {
        return
    }

    nodePath = nodePath.get('source')

    if (state.moduleResolverVisited.has(nodePath)) {
      return;
    }

    state.moduleResolverVisited.add(nodePath);
  
    if (!state.types.isStringLiteral(nodePath)) {
        return;
    }
    
    const sourcePath = nodePath.node.value;
    const currentFile = state.file.opts.filename;
    
    // "extensions" is the currently configured extensions for the base project. This will eventually come from the applications
    // configuration file.
    const extensions = [
        'retail-react-app-account',
        'retail-react-app-tailwind-product-detail',
        'retail-react-app-storefinder',
        'retail-react-app-empty-extension',
        'retail-react-app-custom-home',
        'retail-react-app-core'
    ]

    const importSource = currentFile.includes('extension-') ? 'extension' : 'base'
    const isSelfReference = currentFile.includes(sourcePath.replace('*/', ''))
    

    const modulePath = resolve(sourcePath, {
        basedir: '/Users/bchypak/Projects/pwa-kit/packages/example-project',
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'], // make this configurable
        packageIterator: (request, start, opts) => {
            const paths = extensions.map((extension) => `./node_modules/@salesforce/extension-${extension}/${sourcePath.replace('*/', '')}`)
            
            if (importSource === 'extension') {
               // Import source is an extension
              if (isSelfReference) {
                // Find the index of the extension and chop the list.
                const currentExtension = currentFile.match(/extension-([^/]+)/)[1]
                const index = extensions.indexOf(currentExtension)
                  
                return paths.slice(index + 1)
              } else {
                return [`/Users/bchypak/Projects/pwa-kit/packages/example-project/${sourcePath.replace('*/', '')}`, ...paths]
              }
              
            } else {
               return paths
            }
        },
        preserveSymlinks: false
    })

    if (modulePath) {
        if (nodePath.node.pathResolved) {
          return;
        }
    
        nodePath.replaceWith(state.types.stringLiteral(modulePath));
        nodePath.node.pathResolved = true;
    }
}

const importVisitors = {
  'ImportDeclaration|ExportDeclaration': transformImport,
};

const visitor = {
  Program: {
    enter(programPath, state) {
      programPath.traverse(importVisitors, state);
    },
    exit(programPath, state) {
      programPath.traverse(importVisitors, state);
    },
  },
};

export default ({ types }) => ({
  name: 'module-resolver',

  manipulateOptions(opts) {
    if (opts.filename === undefined) {
      opts.filename = 'unknown';
    }
  },

  pre(file) {
    this.types = types;

    // We need to keep track of all handled nodes so we do not try to transform them twice,
    // because we run before (enter) and after (exit) all nodes are handled
    this.moduleResolverVisited = new Set();
  },

  visitor,

  post() {
    this.moduleResolverVisited.clear();
  },
});