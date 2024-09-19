/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

// Define a type for the HOC props
type WithHeadingProps = React.ComponentPropsWithoutRef<any>;

const packagejson = 
`
  // package.json
  devDependencies: {
    "@Salesforce/extension-sample-3": "file:./app/extensions/extension-local",
    ...
  }
`

const codeSample = 
`
  // config/default.js
  "app": {
    "extensions": [
      "@Salesforce/extension-local"
    ]
  }
`
// Define the HOC function
const withHeading = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const WithHeading: React.FC<P> = (props: WithHeadingProps) => {
    return (
      <div>
        <h1>Hello from a local Application Extension</h1>
        <b>1. If you are reading this it means that "local application extensions" work.... How does it work?</b>
        <br/>
        <br/>
        <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;We rely totally on the Application Extensions NPM packages being installed. So in your `package.json` you might see something like this in your dependency list.</p>
        <pre>
          {packagejson}
        </pre>
        <br/>
        <b>2. This allows you to simply add this application extension to your base project using the package name as you would with an extension that is downloaded from NPM. Like this!</b>
        <br/>
        <pre>
          {codeSample}
        </pre>
        <br/>
        <b>3. This means that we don't have to change any of our Application Extension resolution code. It will just work.</b>
        <br/>
        <br/>
        <WrappedComponent {...(props as P)} />
      </div>
    )
  }

  return WithHeading
}

export default withHeading