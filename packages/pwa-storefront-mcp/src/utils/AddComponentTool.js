export class AddComponentTool {
    constructor() {
      this.componentTemplates = {
        'button': this.createButtonComponent,
        'card': this.createCardComponent,
        'modal': this.createModalComponent,
        'form': this.createFormComponent,
        'list': this.createListComponent,
        'header': this.createHeaderComponent,
        'footer': this.createFooterComponent,
        'product': this.createProductComponent,
        'cart': this.createCartComponent
      };
    }
  
    /**
     * Analyze JavaScript/React code and determine insertion points
     */
    analyzeCodeStructure(code) {
      const analysis = {
        imports: [],
        components: [],
        exports: [],
        insertionPoints: [],
        hasReact: false,
        hasNextJs: false,
        hasTailwind: false
      };
  
      const lines = code.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detect imports
        if (line.startsWith('import ')) {
          analysis.imports.push({
            line: i,
            content: line,
            type: this.getImportType(line)
          });
          
          if (line.includes('react')) analysis.hasReact = true;
          if (line.includes('next/')) analysis.hasNextJs = true;
        }
        
        // Detect component definitions
        if (this.isComponentDefinition(line)) {
          analysis.components.push({
            line: i,
            name: this.extractComponentName(line),
            type: this.getComponentType(line)
          });
        }
        
        // Detect exports
        if (line.startsWith('export ')) {
          analysis.exports.push({
            line: i,
            content: line,
            isDefault: line.includes('default')
          });
        }
        
        // Find potential insertion points
        if (this.isInsertionPoint(line, lines, i)) {
          analysis.insertionPoints.push({
            line: i,
            type: this.getInsertionType(line, lines, i),
            context: this.getInsertionContext(lines, i)
          });
        }
      }
      
      // Check for Tailwind classes
      analysis.hasTailwind = /className\s*=\s*["'][^"']*\b(bg-|text-|p-|m-|flex|grid)/.test(code);
      
      return analysis;
    }
  
    /**
     * Insert a new React component into existing code
     */
    insertComponent(code, componentType, options = {}) {
      const analysis = this.analyzeCodeStructure(code);
      const componentGenerator = this.componentTemplates[componentType.toLowerCase()];
      
      if (!componentGenerator) {
        throw new Error(`Unknown component type: ${componentType}`);
      }
      
      const newComponent = componentGenerator.call(this, options, analysis);
      const insertionPoint = this.findBestInsertionPoint(analysis, options);
      
      return this.performInsertion(code, newComponent, insertionPoint, analysis);
    }
  
    /**
     * Create a complete React component file
     */
    createComponentFile(componentName, componentType, options = {}) {
      const componentGenerator = this.componentTemplates[componentType.toLowerCase()];
      
      if (!componentGenerator) {
        throw new Error(`Unknown component type: ${componentType}`);
      }
      
      const mockAnalysis = {
        hasReact: true,
        hasNextJs: options.framework === 'nextjs',
        hasTailwind: options.styling === 'tailwind'
      };
      
      const component = componentGenerator.call(this, {
        name: componentName,
        ...options
      }, mockAnalysis);
      
      const imports = this.generateImports(component.dependencies, mockAnalysis);
      
      return `${imports}\n\n${component.code}\n\nexport default ${componentName};`;
    }
  
    // Component generators
    createButtonComponent(options, analysis) {
      const { name = 'CustomButton', variant = 'primary', size = 'medium' } = options;
      const useTailwind = analysis.hasTailwind || options.styling === 'tailwind';
      
      const baseClasses = useTailwind 
        ? this.getTailwindButtonClasses(variant, size)
        : 'button';
        
      return {
        code: `const ${name} = ({ children, onClick, disabled = false, className = '', ...props }) => {
    return (
      <button
        className={\`${baseClasses} \${className}\`}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  };`,
        dependencies: ['react']
      };
    }
  
    createCardComponent(options, analysis) {
      const { name = 'Card', showHeader = true, showFooter = false } = options;
      const useTailwind = analysis.hasTailwind || options.styling === 'tailwind';
      
      const cardClasses = useTailwind 
        ? 'bg-white shadow-md rounded-lg overflow-hidden'
        : 'card';
        
      return {
        code: `const ${name} = ({ title, children, footer, className = '', ...props }) => {
    return (
      <div className={\`${cardClasses} \${className}\`} {...props}>
        ${showHeader ? `{title && (
          <div className="${useTailwind ? 'px-6 py-4 border-b border-gray-200' : 'card-header'}">
            <h3 className="${useTailwind ? 'text-lg font-semibold text-gray-800' : 'card-title'}">{title}</h3>
          </div>
        )}` : ''}
        <div className="${useTailwind ? 'px-6 py-4' : 'card-body'}">
          {children}
        </div>
        ${showFooter ? `{footer && (
          <div className="${useTailwind ? 'px-6 py-4 bg-gray-50 border-t border-gray-200' : 'card-footer'}">
            {footer}
          </div>
        )}` : ''}
      </div>
    );
  };`,
        dependencies: ['react']
      };
    }
  
    createProductComponent(options, analysis) {
      const { name = 'ProductCard', showPrice = true, showRating = true } = options;
      const useTailwind = analysis.hasTailwind || options.styling === 'tailwind';
      
      return {
        code: `const ${name} = ({ product, onAddToCart, className = '', ...props }) => {
    const { id, name: productName, price, image, rating, description } = product;
    
    return (
      <div className={\`${useTailwind ? 'bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow' : 'product-card'} \${className}\`} {...props}>
        {image && (
          <div className="${useTailwind ? 'aspect-w-16 aspect-h-9' : 'product-image'}">
            <img 
              src={image} 
              alt={productName}
              className="${useTailwind ? 'w-full h-48 object-cover' : 'product-img'}"
            />
          </div>
        )}
        <div className="${useTailwind ? 'p-4' : 'product-content'}">
          <h3 className="${useTailwind ? 'text-lg font-semibold text-gray-800 mb-2' : 'product-title'}">{productName}</h3>
          {description && (
            <p className="${useTailwind ? 'text-gray-600 text-sm mb-3' : 'product-description'}">{description}</p>
          )}
          <div className="${useTailwind ? 'flex items-center justify-between' : 'product-meta'}">
            ${showPrice ? `<span className="${useTailwind ? 'text-xl font-bold text-green-600' : 'price'}">\${price}</span>` : ''}
            ${showRating ? `{rating && (
              <div className="${useTailwind ? 'flex items-center' : 'rating'}">
                <span className="${useTailwind ? 'text-yellow-400' : ''}">★</span>
                <span className="${useTailwind ? 'ml-1 text-gray-600' : ''}">{rating}</span>
              </div>
            )}` : ''}
          </div>
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              className="${useTailwind ? 'w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors' : 'add-to-cart-btn'}"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    );
  };`,
        dependencies: ['react']
      };
    }
  
    createModalComponent(options, analysis) {
      const { name = 'Modal', closeOnOverlay = true } = options;
      const useTailwind = analysis.hasTailwind || options.styling === 'tailwind';
      
      return {
        code: `const ${name} = ({ isOpen, onClose, title, children, className = '', ...props }) => {
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
      
      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [isOpen]);
  
    if (!isOpen) return null;
  
    return (
      <div 
        className="${useTailwind ? 'fixed inset-0 z-50 flex items-center justify-center' : 'modal-overlay'}"
        onClick={${closeOnOverlay ? 'onClose' : 'undefined'}}
      >
        <div className="${useTailwind ? 'fixed inset-0 bg-black bg-opacity-50' : 'modal-backdrop'}" />
        <div 
          className={\`${useTailwind ? 'relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4' : 'modal-content'} \${className}\`}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {title && (
            <div className="${useTailwind ? 'px-6 py-4 border-b border-gray-200' : 'modal-header'}">
              <h2 className="${useTailwind ? 'text-xl font-semibold text-gray-800' : 'modal-title'}">{title}</h2>
              <button
                onClick={onClose}
                className="${useTailwind ? 'absolute top-4 right-4 text-gray-400 hover:text-gray-600' : 'modal-close'}"
              >
                ×
              </button>
            </div>
          )}
          <div className="${useTailwind ? 'px-6 py-4' : 'modal-body'}">
            {children}
          </div>
        </div>
      </div>
    );
  };`,
        dependencies: ['react']
      };
    }
  
    // Helper methods
    isComponentDefinition(line) {
      return /^(const|function|class)\s+[A-Z]\w*/.test(line) || 
             /^export\s+(const|function|class)\s+[A-Z]\w*/.test(line);
    }
  
    extractComponentName(line) {
      const match = line.match(/(?:const|function|class)\s+([A-Z]\w*)/);
      return match ? match[1] : null;
    }
  
    getComponentType(line) {
      if (line.includes('class ') && line.includes('extends')) return 'class';
      if (line.includes('function ')) return 'function';
      if (line.includes('const ') && line.includes('=>')) return 'arrow';
      return 'unknown';
    }
  
    getImportType(line) {
      if (line.includes("from 'react'")) return 'react';
      if (line.includes("from 'next/")) return 'nextjs';
      if (line.includes('.css') || line.includes('.scss')) return 'styles';
      if (line.startsWith('import ') && line.includes('./')) return 'local';
      return 'external';
    }
  
    isInsertionPoint(line, lines, index) {
      // After imports
      if (line.startsWith('import ') && 
          index + 1 < lines.length && 
          !lines[index + 1].trim().startsWith('import ')) {
        return true;
      }
      
      // Before export default
      if (line.startsWith('export default') && index > 0) return true;
      
      // End of file
      if (index === lines.length - 1) return true;
      
      return false;
    }
  
    getInsertionType(line, lines, index) {
      if (line.startsWith('import ')) return 'after-imports';
      if (line.startsWith('export default')) return 'before-export';
      if (index === lines.length - 1) return 'end-of-file';
      return 'general';
    }
  
    getInsertionContext(lines, index) {
      const start = Math.max(0, index - 2);
      const end = Math.min(lines.length, index + 3);
      return lines.slice(start, end);
    }
  
    findBestInsertionPoint(analysis, options) {
      // Prefer after imports
      const afterImports = analysis.insertionPoints.find(p => p.type === 'after-imports');
      if (afterImports) return afterImports;
      
      // Fallback to before export
      const beforeExport = analysis.insertionPoints.find(p => p.type === 'before-export');
      if (beforeExport) return beforeExport;
      
      // Last resort: end of file
      return analysis.insertionPoints.find(p => p.type === 'end-of-file') || { line: 0, type: 'start' };
    }
  
    performInsertion(code, component, insertionPoint, analysis) {
      const lines = code.split('\n');
      const insertLine = insertionPoint.type === 'before-export' ? insertionPoint.line : insertionPoint.line + 1;
      
      // Add necessary imports
      const imports = this.generateImports(component.dependencies, analysis);
      const importsToAdd = this.filterNewImports(imports, analysis);
      
      // Insert component code
      lines.splice(insertLine, 0, '', component.code, '');
      
      // Insert imports at the top
      if (importsToAdd) {
        const importInsertLine = analysis.imports.length > 0 
          ? analysis.imports[analysis.imports.length - 1].line + 1 
          : 0;
        lines.splice(importInsertLine, 0, importsToAdd);
      }
      
      return lines.join('\n');
    }
  
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
  
    getTailwindButtonClasses(variant, size) {
      const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        success: 'bg-green-600 text-white hover:bg-green-700'
      };
      
      const sizes = {
        small: 'px-3 py-1 text-sm',
        medium: 'px-4 py-2',
        large: 'px-6 py-3 text-lg'
      };
      
      return `${variants[variant] || variants.primary} ${sizes[size] || sizes.medium} rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`;
    }
  }
  