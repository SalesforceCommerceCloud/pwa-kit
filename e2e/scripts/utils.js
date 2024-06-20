/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const { types } = require("util");
const fs = require("fs");
const promisify = require("util").promisify;
const statAsync = promisify(fs.stat);
const mkdirAsync = promisify(fs.mkdir);

const isPrompt = (streamData, expectedText) => {
  if (!streamData || !expectedText) return false;

  if (types.isRegExp(expectedText)) {
    return streamData.match(expectedText);
  } else return streamData.includes(expectedText);
};

const mkdirIfNotExists = (dirname) =>
  statAsync(dirname).catch(() => mkdirAsync(dirname));

const diffArrays = (expectedArr, actualArr) => {
  const actualSet = new Set(actualArr);
  return [...expectedArr].filter((x) => !actualSet.has(x));
};

const getCreditCardExpiry = (yearsFromNow = 5) => {
  const padMonth = "00";
  return `${(padMonth + (new Date().getMonth() + 1)).slice(-padMonth.length)}/${
    (new Date().getFullYear() % 100) + parseInt(yearsFromNow)
  }`;
};

/**
 * Generates a random string of given length containing uppercase letters, lowercase letters and numbers.
 * @param {number} length Length of generated string required.
 * @returns Randomly generated alphanumeric string.
 */
const generateRandomString = function (length) {
  let randomString = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    randomString += characters.charAt(
      Math.floor(Math.random() * charactersLength)
    );
    counter += 1;
  }
  return randomString;
};

/**
 * Generates a random valid phone number string
 * @param {number} length Length of generated string required.
 * @returns Randomly generated numeric string.
 */
const generateRandomNumericString = function (length) {
  // US Phone numbers must have the format NXX NXX-XXXX
  // where N cannot be 0 or 1.
  // The area code cannot have 9 in the 2nd digit
  // The middle 3 digits cannot be N11

  let randomPhone = "";
  const validNumbers = "23456789"; // exclude 0 or 1 to keep things simple
  const validNumbersLength = validNumbers.length;
  let counter = 0;
  while (counter < length) {
    randomPhone += validNumbers.charAt(
      Math.floor(Math.random() * validNumbersLength)
    );
    counter += 1;
  }
  return randomPhone;
};

/**
 * Generates a random user object containing firstName, lastName, phone, email and password based on locale (Supports en_US and en_GB only).
 * @returns Object containing randomly generated user data.
 */
const generateUserCredentials = function () {
  const user = {};
  user.firstName = generateRandomString(8);
  user.lastName = generateRandomString(8);
  user.phone = "857" + generateRandomNumericString(7);
  user.email = (generateRandomString(12) + "@domain.com").toLowerCase();
  user.password = generateRandomString(15) + "Ab1!%&*$#@^+:;=?";
  user.address = {}
  user.address.street = generateRandomString(10);
  user.address.city = "Burlington";
  user.address.state = "MA";
  user.address.zipcode = "02" + generateRandomNumericString(3);

  return user;
};

module.exports = {
  isPrompt,
  mkdirIfNotExists,
  diffArrays,
  getCreditCardExpiry,
  generateUserCredentials,
};
