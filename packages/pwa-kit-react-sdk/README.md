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

A library that supports the isomorphic React rendering pipeline for Commerce Cloud Managed Runtime apps.

## Requirements

-   [Git](https://git-scm.com/)
-   We recommend you use [nvm](https://github.com/creationix/nvm#installation) to
    manage node and npm versions.
-   Node ^10.17.0 || ^12.0.0 [LTS](https://github.com/nodejs/LTS#lts-schedule). We recommend
    using the latest version of Node supported whenever possible.
-   npm ^5.x

## Install Dependencies

```bash
npm i
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
`[PWA Kit API WARNING]: You are currently using an experimental function: [someExperimentalFunction] This function may change at any time.`

```javascript
import {deprecate} from './utils/warnings'

someFunctionToBeDeprecated() => {
  // with custom message
  deprecate("It will be removed in version 1.2.3. Please use [newFunction] instead.")

  // the function implementation
}
```

This is the warning that will print in your browser:
`[PWA Kit API WARNING]: You are currently using an deprecated function: [someFunctionToBeDeprecated]. It will be removed in version 1.2.3. Please use [newFunction] instead.`

## Documentation

Please see the [Documentation README](https://github.com/mobify/progressive-web-sdk/blob/develop/docs/README.md).
