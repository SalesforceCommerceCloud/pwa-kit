/**
 * This module is imported using PWA-Kit override module resolution. Proper file descriptions will be added
 * soon.
 */
// declare module '\*' {
//     const value: any;
//     export default value;
// }

// NOTE: This isn't a great solution. But for our initial release it's better than having red squiggly 
// lines under all our wildcard import statments. In the near future we can look at how extensions can
// export their public interfaced types as a .d.ts file, which would then be consumed by other extensions
// or base projects so that their type information is available. 
//
// This would potentially be another reason why we might want to "build" our extensions instead of leaving
// them as globs of code that is transpiled by the base project.
// 
// NOTE: If an app extension contains "overrides" in it, it implies that it has a dependency on another
// application extension. We should be specifying those dependent app extensions as peer dependencies.
// We can then use that information in the pacakge.json dependencies to infer the module resolution.