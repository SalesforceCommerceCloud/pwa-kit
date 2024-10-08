/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

// Define a type for the HOC props
type WithRedBorderProps = React.ComponentPropsWithoutRef<any>;

// Define the HOC function
const withRedBorder = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const WithRedBorder: React.FC<P> = (props: WithRedBorderProps) => {
    return (
      <div style={{ border: '2px solid blue', padding: '10px' }}>
        <WrappedComponent {...(props as P)} />
      </div>
    )
  }

  return WithRedBorder
}

export default withRedBorder