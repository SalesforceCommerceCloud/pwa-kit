/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const { exec } = require("child_process");
const { isPrompt } = require("./utils.js");

const runGeneratorWithResponses = (cmd, cliResponses = []) => {
  const child = exec(cmd);
  return new Promise((resolve, reject) => {
    let expectedPrompt, response;
    if (cliResponses && cliResponses.length) {
      ({ expectedPrompt, response } = cliResponses.shift());
    }

    child.stdout.on("data", (data) => {
      console.log(data);
      if (isPrompt(data, expectedPrompt)) {
        child.stdin.write(response);
        if (cliResponses.length > 0) {
          ({ expectedPrompt, response } = cliResponses.shift());
        }
      }
    });

    child.stderr.on("data", (err) => {
      console.error(err);
    });

    child.on("error", (code) => {
      reject(`Child process exited with code ${code}.`);
    });

    child.on("close", (code) => {
      resolve(`Child process exited with code ${code}.`);
    });
  });
};

const executeCommand = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error.message);
      }
      if (stderr) {
        reject(stderr);
      }

      resolve(stdout);
    });
  });
};

module.exports = {
  runGeneratorWithResponses,
  executeCommand,
};
