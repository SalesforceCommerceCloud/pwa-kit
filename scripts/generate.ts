/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-console */

import {amf} from '@commerce-apps/raml-toolkit';
import {
  ApiMetadata,
  ApiModel,
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

  const addTemplate = (api: ApiMetadata, filename: string) =>
    api.addTemplate(
      // input: look in template dir
      path.join(TEMPLATE_DIR, filename),
      // output: strip .hbs and give each API its own dir
      path.join(
        OUTPUT_DIR,
        api.name.upperCamelCase,
        filename.replace(/\.hbs$/, '')
      )
    );

  // Add templates to render
  (apis.children as ApiModel[]).forEach(api => {
    const name = api.name.upperCamelCase;
    // Type assertion because amf has bad types :\
    const model = api.model as unknown as {encodes: amf.model.domain.WebApi};
    if (customHelpers.hasMutations(name, model)) {
      addTemplate(api, 'mutation.ts.hbs');
    }
    if (customHelpers.hasQueries(name, model)) {
      addTemplate(api, 'query.ts.hbs');
      addTemplate(api, 'queryKeyHelpers.ts.hbs');
    }
    addTemplate(api, 'index.ts.hbs');
  });

  // Render everything!
  await apis.render();
}

generate().catch(console.error);
