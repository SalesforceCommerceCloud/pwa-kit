  _________ __                         ___________.__            .___            
 /   _____//  |_  ___________   ____   \_   _____/|__| ____    __| _/___________ 
 \_____  \\   __\/  _ \_  __ \_/ __ \   |    __)  |  |/    \  / __ |/ __ \_  __ \
 /        \|  | (  <_> )  | \/\  ___/   |     \   |  |   |  \/ /_/ \  ___/|  | \/
/_______  /|__|  \____/|__|    \___  >  \___  /   |__|___|  /\____ |\___  >__|   
        \/                         \/       \/            \/      \/    \/     

# Description

Welcome to the Store Finder PWA-Kit Application Extension. Adding this extention to you PWA Kit app
will add a new page allowing your customers to find the closest brick and mortar location to them.

# Dependancies

"@ant-design/icons": "^5.4.0", 
"@loadable/component": "^5.15.3",
"@salesforce/pwa-kit-react-sdk": "4.0.0-dev",
"antd": "^5.20.0",

"leaflet": "^1.9.4",
"react": "^18.2.0",
"react-dom": "^18.2.0",
"react-helmet": "^6.1.0",
"react-leaflet": "^4.2.1"

# Configuration

```
{
    path: '/store-finder',
    layout: 'map-on-left', // Options include ['map-on-left', 'map-on-right', 'map-on-top', 'no-map'],
    defaultLoctation: '90210',
    enableLocationServices: true
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

Application Extensions support "overrides" so if you would like to cuztomize something that isn't available in
the configuration above you can override the following files

## Overridable Files

- /src/components/map.js --This component will be passed a coordinates object of the currently selected store.
- /src/components/heading.js


