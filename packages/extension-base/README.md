 __                       _          __      _                 _             
/ _\ __ _ _ __ ___  _ __ | | ___    /__\_  _| |_ ___ _ __  ___(_) ___  _ __  
\ \ / _` | '_ ` _ \| '_ \| |/ _ \  /_\ \ \/ / __/ _ \ '_ \/ __| |/ _ \| '_ \ 
_\ \ (_| | | | | | | |_) | |  __/ //__  >  <| ||  __/ | | \__ \ | (_) | | | |
\__/\__,_|_| |_| |_| .__/|_|\___| \__/ /_/\_\\__\___|_| |_|___/_|\___/|_| |_|
                   |_|                                                       

# Description

This is a sample PWA-Kit Application Extension. The purpose of this application extensions is to show how
the Application Extensions API can be used to enhance your PWA-Kit base project.

# Folder Structure

Insert description of generic Application Extension folder structure here.

# Peer Dependancies

PWA-Kit Application Extensions are NPM packages at their most simplest form, and as such you can define
what peer dependencies are required when using it. Because this sample application extension provides
UI via a new "Sample" page, it requires that the below dependencies are installed at a minimum. 

Depending on what features your application extensions provides it's recommended you include any third-party
packages as peer dependencies so that your base application doesn't end up having multiple versions of a 
given package.

"react": "^18.2.0",
"react-dom": "^18.2.0"

# Configuration

This section is optional and will depend on your application extensions implementation. If you have features
that are configurable, then list those configurations here so that the PWA-Kit project implementor can configure
the extension as they like. 

```
{
    path: 'sample-page'
}
```

# Installation

```
> npm install @salesforce/extension-sample --legacy-peer-deps*<br/>
> Downloading npm package... <br/>
> Installing extention... <br/>
> Finished. <br/>
> Congratulations! The Sample extension was successfully installed! Please visit https://www.npmjs.com/package/@salesforce/extension-sample for more information on how to use this extension.
```

# Advanced Usage

In order to customize this Application Extension to your particulare needs we suggest that you refer to the section titled
"configuration", but if there is something that you want to customize that isn't configurable and cannot wait for a feature
request to be fulfilled, then you can use overrides. 

Below is a list of files that can't be overridden from within your PWA-Kit base project. Please refer to the documentation here on
how to properly override extensions. Additionally it's up to the Application Extension developer as to which files can and 
cannot be overridden. Please refer to this documentation on how to write your first PWA-Kit Application Extension.

## Overridable Files

```
/src/path/to/overridable/file.ts
```


