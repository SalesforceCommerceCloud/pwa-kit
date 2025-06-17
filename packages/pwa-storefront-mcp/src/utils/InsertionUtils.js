
export class InsertionUtils {
    generateImports(dependencies, analysis) {
        const imports = [];
        
        if (dependencies.includes('react') && !analysis.hasReact) {
          imports.push("import React, { useEffect } from 'react';");
        } else if (dependencies.includes('useEffect') && !analysis.imports.some(imp => imp.content.includes('useEffect'))) {
          // Need to update existing React import to include useEffect
          imports.push("// Update React import to include useEffect");
        }
        
        return imports.join('\n');
      }
    
      filterNewImports(imports, analysis) {
        // Filter out imports that already exist
        return imports;
      }
    }