/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-console */

import {
  HandlebarsWithAmfHelpers as Handlebars,
  loadApiDirectory,
} from '@commerce-apps/raml-toolkit/lib/generate';
import addHelpers from 'handlebars-helpers';
import path from 'path';
import * as customHelpers from './templateHelpers';

const API_DIR = path.join(__dirname, '../apis');
const OUTPUT_DIR = path.join(__dirname, '../src/lib');
const TEMPLATE_DIR = path.join(__dirname, '../templates');

async function generate() {
  console.log(`Creating hooks for ${API_DIR}`);

  // Add helpers from handlebars-helpers
  addHelpers({handlebars: Handlebars});
  // Add our custom helpers (may not be necessary)
  Object.entries(customHelpers).forEach(([key, helper]) =>
    Handlebars.registerHelper(key, helper)
  );

  // Load APIs
  const apis = loadApiDirectory(API_DIR);
  await apis.init();

  // Add templates to render
  apis.children.forEach(api => {
    api.addTemplate(
      path.join(TEMPLATE_DIR, 'action.ts.hbs'),
      path.join(OUTPUT_DIR, api.name.upperCamelCase, `action.ts`)
    );
    api.addTemplate(
      path.join(TEMPLATE_DIR, 'query.ts.hbs'),
      path.join(OUTPUT_DIR, api.name.upperCamelCase, `query.ts`)
    );
    api.addTemplate(
      path.join(TEMPLATE_DIR, 'index.ts'),
      path.join(OUTPUT_DIR, api.name.upperCamelCase, `index.ts`)
    );
  });

  // Render everything!
  await apis.render();
}

generate().catch(console.error);
