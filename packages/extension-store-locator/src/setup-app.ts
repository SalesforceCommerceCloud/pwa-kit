/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from "react";
import loadable from "@loadable/component";
import {
  ApplicationExtension,
  IRouteConfig,
} from "@salesforce/pwa-kit-react-sdk/ssr/universal/extensibility";

import { ReactExtensionConfig as Config } from "./types";

const StoreLocator = loadable(() => import("./pages/store-locator"));

class Sample extends ApplicationExtension<Config> {
  extendApp(App: React.ComponentType): React.ComponentType {
    return App;
  }

  extendRoutes(routes: IRouteConfig[]): IRouteConfig[] {
    routes.push({
      path: "/store-locator",
      component: StoreLocator,
    });
    return routes;
  }
}

export default Sample;
