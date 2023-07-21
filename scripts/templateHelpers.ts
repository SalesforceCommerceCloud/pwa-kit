/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {amf} from '@commerce-apps/raml-toolkit';
import {getTypeFromParameter} from '@commerce-apps/raml-toolkit/lib/generate/handlebarsAmfHelpers';

/**
 * Given an individual type or an array of types in the format Array\<Foo | Baa\>
 * will return either the type prefixed by the namespace, or the Array with each type prefixed
 * eg. Array\<types.Foo | types.Baa\>
 *
 * @param content - to be parsed for types to prefix with a namespace
 * @param namespace - to be prefixed to types
 * @returns the content prefixed with the namespace
 */
export function addNamespace(content: string, namespace: string): string {
  // Not handling invalid content.
  if (!content) {
    throw new Error('Invalid content');
  }
  // Not handling invalid namespace.
  if (!namespace) {
    throw new Error('Invalid namespace');
  }

  // if the content is an array, extract all of the elements
  const matched = /^Array<(.*?)>$/.exec(content);
  if (matched && !matched[1]) {
    throw new Error(`Array type has no content.`);
  }
  const isArrayType = !!matched;
  const types = matched ? matched[1] : content;

  // Get a handle on individual types
  const typesToProcess = types.split('|');
  const namespaceTypes: string[] = [];

  // for each type
  typesToProcess.forEach(checkType => {
    // trim the fat
    const actualType = checkType.trim();
    // check if there's an actual type present
    if (actualType === '') {
      throw new Error('Empty type found');
    }

    // void and object types don't get a namespace
    if (['void', 'object'].includes(actualType.toLocaleLowerCase())) {
      namespaceTypes.push(actualType);
    } else {
      // everything else does
      namespaceTypes.push(`${namespace}.${actualType}`);
    }
  });

  // reconstruct the passed in type with the namespace
  const processedTypes = namespaceTypes.join(' | ');

  // Re-add Array if required
  if (isArrayType) {
    return `Array<${processedTypes}>`;
  }
  return processedTypes;
}

/**
 * Certain characters need to be handled for TSDoc.
 *
 * @param str - The string to be formatted for TSDoc
 *
 * @returns string reformatted for TSDoc
 */
export const formatForTsDoc = (str: string): string => {
  // Brackets are special to TSDoc and less than / greater than are interpreted as HTML
  const symbolsEscaped = str
    .toString()
    .replace(/([^\\])(["{}<>]+)/g, m => Array.from(m).join('\\'));
  // Double escaped newlines are replaced with real newlines
  const newlinesUnescaped = symbolsEscaped.replace(/\\n/g, '\n');
  // Double escaped tabs are replaced with a single space
  const tabsUnescaped = newlinesUnescaped.replace(/(\\t)+/g, ' ');
  // Collapse leading whitespace of 4 or more to avoid triggering code block formatting
  const collapsedLeadingWhitespace = tabsUnescaped.replace(/\n {4,}/g, '\n   ');

  return collapsedLeadingWhitespace;
};

/**
 * Forces the input to all caps.
 *
 * @param input - The string you want to change to all caps
 *
 * @returns string in all caps
 */
export const loud = (input: string): string => String(input).toUpperCase();

/**
 * Checks whether a trait is allowed to be used in the API. Only traits that comply
 * with API standards are allowed.
 *
 * Currently, the only known non-compliant trait is "offset-paginated". It does
 * not comply because it is not a camel case name. It can be safely ignored because
 * the compliant "OffsetPaginated" is also available. (The kebab case version has
 * not been removed to maintain backward compatibility.)
 *
 * @param trait - Trait to check
 * @returns Whether the trait name is a valid TypeScript type identifier
 */
export const isAllowedTrait = (trait: amf.model.domain.Trait): boolean =>
  /^[A-Za-z][A-Za-z0-9]*$/.test(trait.name.value());

export const getParameterTypes = (
  params: amf.model.domain.Parameter[]
): Record<string, string> => {
  // Aggregate parameters by type
  const map = new Map<string, Set<string>>();
  params.forEach(param => {
    const name = param.name.value();
    const type = getTypeFromParameter(param);
    const set = map.get(name);
    if (set) {
      set.add(type);
    } else {
      map.set(name, new Set([type]));
    }
  });

  // Convert map to object for ease of use in template
  const obj: Record<string, string> = {};
  map.forEach((types, name) => {
    // Convert set of types to single union type
    obj[name] = Array.from(types).join(' | ');
  });
  return obj;
};

export const getPathParameterTypeMapFromEndpoints = (
  endpoints: amf.model.domain.EndPoint[]
): Record<string, string> => {
  // TODO: Convert .map.reduce to .flatMap when support for node v10 is dropped
  const parameters = endpoints
    .map(ep => ep.parameters)
    .reduce((a, b) => a.concat(b), []);
  return getParameterTypes(parameters);
};

export const getQueryParameterTypeMapFromEndpoints = (
  endpoints: amf.model.domain.EndPoint[]
): Record<string, string> => {
  // TODO: Convert .map.reduce to .flatMap when support for node v10 is dropped
  const parameters = endpoints
    .map(ep => ep.operations)
    .reduce((a, b) => a.concat(b), [])
    .map(op => (op.request && op.request.queryParameters) || [])
    .reduce((a, b) => a.concat(b), []);

  return getParameterTypes(parameters);
};

export function assign(
  varName: string,
  varValue: unknown,
  options: Handlebars.HelperOptions
): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, no-param-reassign
  options.data.root[varName] = varValue;
}

export const createQueryKeyFragment = (
  path: string,
  variable: string | null
): string =>
  // If the URL ends with a {template} fragment, we end up with a `, ''` that we don't need
  `'${path.replace(
    /\{(\w+)\}/g,
    // If `variable` is passed, generate JS, else generate TS
    `', ${variable ? `${variable}.$1` : 'string | undefined'}, '`
  )}'`.replace(", ''", '');

/** Determines whether an API endpoint is neither a query nor mutation. */
const isNothing = (
  apiName: string,
  operation: amf.model.domain.Operation
): boolean => {
  const name = operation.name.value();
  const SKIP_SLAS = [
    // These methods manipulate headers; they don't mutate data or return a body, so they don't
    // fall under the current scope of query or mutation hooks.
    'authenticateCustomer',
    'authorizeCustomer',
    'getPasswordResetToken',
    'getTrustedAgentAuthorizationToken',
  ];
  const SKIP_SHOPPER_CUSTOMERS = [
    // These methods are deprecated
    'invalidateCustomerAuth',
    'authorizeCustomer',
    'authorizeTrustedSystem',
  ];
  switch (apiName) {
    case 'ShopperLogin':
      return SKIP_SLAS.includes(name);
    case 'ShopperCustomers':
      return SKIP_SHOPPER_CUSTOMERS.includes(name);
    default:
      return false;
  }
};

/** Determines whether an API endpoint is a query. */
export const isQuery = (
  apiName: string,
  operation: amf.model.domain.Operation
): boolean => {
  if (isNothing(apiName, operation)) return false;
  const isGet = operation.method.value() === 'get';
  const name = operation.name.value();
  if (apiName === 'ShopperLogin') {
    // logoutCustomer is GET, but changes state, so it is not a query
    return isGet && name !== 'logoutCustomer';
  }
  if (apiName === 'ShopperCustomers') {
    // authorizeCustomer is GET, but changes state, so it is not a query
    return isGet && name !== 'authorizeCustomer';
  }
  if (apiName === 'ShopperGiftCertificates') {
    // getGiftCertificate is POST, does not change state, so it is a query
    // (It is POST, rather than GET, because gift certificate code is a secret)
    return isGet || name === 'getGiftCertificate';
  }
  return isGet;
};

/** Determines whether an API endpoint is a mutation. */
export const isMutation = (
  apiName: string,
  operation: amf.model.domain.Operation
): boolean => !isNothing(apiName, operation) && !isQuery(apiName, operation);

/** Determines whether an API spec contains query endpoints. */
export const hasQueries = (
  apiName: string,
  model: {encodes: amf.model.domain.WebApi}
): boolean =>
  model.encodes.endPoints.some(ep =>
    ep.operations.some(op => isQuery(apiName, op))
  );

/** Determines whether an API spec contains mutation endpoints. */
export const hasMutations = (
  apiName: string,
  model: {encodes: amf.model.domain.WebApi}
): boolean =>
  model.encodes.endPoints.some(ep =>
    ep.operations.some(op => isMutation(apiName, op))
  );
