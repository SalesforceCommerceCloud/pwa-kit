/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const executeShell = require("../execute-shell-commands");
const config = require("../../config.js");

const main = async () => {
  const latestGitSHA = await executeShell.executeCommand(
    config.GET_GIT_SHA_CMD
  );
  config.GENERATE_PROJECTS.forEach(async (project) => {
    const outputDir = `../generated-projects/${project}-${latestGitSHA}`;
    const generateAppCommand = `${config.GENERATOR_CMD} ${outputDir}`;
    const stdout = await executeShell.runGeneratorWithResponses(
      generateAppCommand,
      config.CLI_RESPONSES[project]
    );
    console.log(stdout);
  });
};

main();
