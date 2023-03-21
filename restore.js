/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const fs = require("fs");
const depMap = require("./output.json");
const packages = fs.readdirSync("./packages/");
const { version } = require("./package.json");
for (const name of packages) {
  const path = `./packages/${name}/package.json`;
  const file = fs.readFileSync(path, "utf8");
  const spaces = file.match(/ +/)[0].length;
  const pkg = JSON.parse(file);
  if (pkg.build) pkg.build = pkg.build.replace(/^echo '(.*)'$/, "$1");
  const { deps = [], devDeps = [] } = depMap[name] ?? {};
  for (const dep of deps) pkg.dependencies[dep] = version;
  for (const dep of devDeps) pkg.devDependencies[dep] = version;
  fs.writeFileSync(path, JSON.stringify(pkg, null, spaces));
}
