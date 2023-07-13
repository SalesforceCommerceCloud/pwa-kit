/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const { types } = require("util");
const fs = require('fs')
const promisify = require("util").promisify;
const statAsync = promisify(fs.stat)
const mkdirAsync = promisify(fs.mkdir);

const isPrompt = (streamData, expectedText) => {
  if (!streamData || !expectedText) return;

  if (types.isRegExp(expectedText)) {
    return streamData.match(expectedText);
  } else return streamData.includes(expectedText);
};

const mkdirIfNotExists = (dirname) =>
  statAsync(dirname).catch(() => mkdirAsync(dirname));

module.exports = {
  isPrompt,
  mkdirIfNotExists,
};
