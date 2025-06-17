
export class InsertExistingComponentTool {
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
    
}