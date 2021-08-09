```
 (                                                                              (    (         )
 )\ )                                                   (  (               )    )\ ) )\ )   ( /(
(()/( (         (  (  (      (         (    )      (    )\))(   '   (   ( /(   (()/((()/(   )\())
 /(_)))(    (   )\))( )(    ))\ (   (  )\  /((    ))\  ((_)()\ )   ))\  )\())   /(_))/(_))|((_)\
(_)) (()\   )\ ((_))\(()\  /((_))\  )\((_)(_))\  /((_) _(())\_)() /((_)((_)\   (_)) (_))_ |_ ((_)
| _ \ ((_) ((_) (()(_)((_)(_)) ((_)((_)(_)_)((_)(_))   \ \((_)/ /(_))  | |(_)  / __| |   \| |/ /
|  _/| '_|/ _ \/ _` || '_|/ -_)(_-<(_-<| |\ V / / -_)   \ \/\/ / / -_) | '_ \  \__ \ | |) | ' <
|_|  |_|  \___/\__, ||_|  \___|/__//__/|_| \_/  \___|    \_/\_/  \___| |_.__/  |___/ |___/ _|\_\
               |___/
```

[![NPM](https://nodei.co/npm/progressive-web-sdk.png?downloads=true&stars=true)](https://nodei.co/npm/progressive-web-sdk/) [![CircleCI](https://circleci.com/gh/mobify/progressive-web-sdk.svg?style=svg&circle-token=c41dc67ed5bb7c6a485789d6e7c1323e7f1649fb)](https://circleci.com/gh/mobify/progressive-web-sdk)

A set of components and utilities which make up the SDK for Progressive Web

You can find the latest version of the SDK Docs on [DevCenter](https://dev.mobify.com/)

## Requirements

-   [Git](https://git-scm.com/)
-   We recommend you use [nvm](https://github.com/creationix/nvm#installation) to
    manage node and npm versions.
-   Node ^10.17.0 or ^12.x
-   npm ^5.7.1 or ^6.11.3

## Install Dependencies

```bash
npm i
```

## Usage

The Progressive Web SDK has a number of components that can be used in progressive web builds.
Component documentation and examples can be seen by running our styleguide:

```bash
npm run docs:dev
```

You can now view the styleguide at [http://localhost:9000.](http://localhost:9000)

Our docs are built on [styleguidist.](https://github.com/sapegin/react-styleguidist)

## Use the SDK in a project

To use the progressive-web-sdk in a project, add it as a dev-dependency to your package.json.
Once you have done that, run `npm install`.

Components can now be imported into your project by loading the build files from `dist`:

```javascript
import Button from 'progressive-web-sdk/dist/components/button'

const myButton = <Button text="Take My Money!" />
```

If you are actively developing a new library or component in the SDK, run the following
command in order for the files to be built into `dist` when making changes in `src`:

```javascript
npm run dev:watch
```

## Marking public API functions as experimental or deprecated

To mark a function as experimental or deprecated in code, you can use the utility functions `experimental()` or `deprecate()` from `progressive-web-sdk/src/utils/warnings` within your experimental/deprecated function. This will prompt a warning in the browser whenever your function is used. You can add an additional custom message to the warning by passing a string into the first parameter.

Example usage:

```javascript
import {experimental} from './utils/warnings'

someExperimentalFunction() => {
  // regular usage
  experimental()

  // the function implementation
}
```

This is the warning that will print in your browser:
`[MOBIFY API WARNING]: You are currently using an experimental function: [someExperimentalFunction] This function may change at any time.`

```javascript
import {deprecate} from './utils/warnings'

someFunctionToBeDeprecated() => {
  // with custom message
  deprecate("It will be removed in version 1.2.3. Please use [newFunction] instead.")

  // the function implementation
}
```

This is the warning that will print in your browser:
`[MOBIFY API WARNING]: You are currently using an deprecated function: [someFunctionToBeDeprecated]. It will be removed in version 1.2.3. Please use [newFunction] instead.`

## Documentation

Please see the [Documentation README](https://github.com/mobify/progressive-web-sdk/blob/develop/docs/README.md).
