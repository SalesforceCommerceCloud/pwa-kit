"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLog = exports.readCredentials = exports.getCredentialsFile = exports.glob = exports.createBundle = exports.defaultMessage = exports.CloudAPIClient = exports.getPwaKitDependencies = exports.getLowestPackageVersion = exports.getProjectDependencyTree = exports.walkDir = exports.getProjectPkg = exports.getPkgJSON = exports.DEFAULT_DOCS_URL = exports.DEFAULT_CLOUD_ORIGIN = void 0;
/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const archiver_1 = __importDefault(require("archiver"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const url_1 = require("url");
const fs_extra_1 = require("fs-extra");
const minimatch_1 = require("minimatch");
const git_rev_sync_1 = __importDefault(require("git-rev-sync"));
const validator_1 = __importDefault(require("validator"));
const child_process_1 = require("child_process");
const semver_1 = __importDefault(require("semver"));
exports.DEFAULT_CLOUD_ORIGIN = 'https://cloud.mobify.com';
exports.DEFAULT_DOCS_URL = 'https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/pushing-and-deploying-bundles.html';
/**
 * Get the package info for pwa-kit-dev.
 */
const getPkgJSON = () => __awaiter(void 0, void 0, void 0, function* () {
    const candidates = [
        path_1.default.join(__dirname, '..', 'package.json'),
        path_1.default.join(__dirname, '..', '..', 'package.json')
    ];
    for (const candidate of candidates) {
        try {
            const data = yield (0, fs_extra_1.readJson)(candidate);
            return data;
        }
        catch (_a) {
            // Keep looking
        }
    }
    return { name: '@salesforce/pwa-kit-dev', version: 'unknown' };
});
exports.getPkgJSON = getPkgJSON;
/**
 * Get the package info for the current project.
 */
const getProjectPkg = () => __awaiter(void 0, void 0, void 0, function* () {
    const p = path_1.default.join(process.cwd(), 'package.json');
    try {
        const data = yield (0, fs_extra_1.readJson)(p);
        return data;
    }
    catch (_b) {
        throw new Error(`Could not read project package at "${p}"`);
    }
});
exports.getProjectPkg = getProjectPkg;
/**
 * Get the set of file paths within a specific directory
 * @param dir Directory to walk
 * @returns Set of file paths within the directory
 */
const walkDir = (dir, baseDir, fileSet) => __awaiter(void 0, void 0, void 0, function* () {
    fileSet = fileSet || new Set();
    const entries = yield (0, fs_extra_1.readdir)(dir, { withFileTypes: true });
    yield Promise.all(entries.map((entry) => __awaiter(void 0, void 0, void 0, function* () {
        const entryPath = path_1.default.join(dir, entry.name);
        if (entry.isDirectory()) {
            yield (0, exports.walkDir)(entryPath, baseDir, fileSet);
        }
        else {
            fileSet === null || fileSet === void 0 ? void 0 : fileSet.add(entryPath.replace(baseDir + path_1.default.sep, ''));
        }
    })));
    return fileSet;
});
exports.walkDir = walkDir;
/**
 * Returns a DependencyTree that includes the versions of all packages
 * including their dependencies within the project.
 *
 * @returns A DependencyTree with the versions of all dependencies
 */
const getProjectDependencyTree = () => __awaiter(void 0, void 0, void 0, function* () {
    // When executing this inside template-retail-react-app, the output of `npm ls` exceeds the
    // max buffer size that child_process can handle, so we can't use that directly. The max string
    // size is much larger, so writing/reading a temp file is a functional workaround.
    const tmpDir = yield (0, fs_extra_1.mkdtemp)(path_1.default.join(os_1.default.tmpdir(), 'pwa-kit-dev-'));
    const destination = path_1.default.join(tmpDir, 'npm-ls.json');
    try {
        (0, child_process_1.execSync)(`npm ls --all --json > ${destination}`);
        return yield (0, fs_extra_1.readJson)(destination, 'utf8');
    }
    catch (_) {
        // Don't prevent bundles from being pushed if this step fails
        return null;
    }
    finally {
        // Remove temp file asynchronously after returning; ignore failures
        void (0, fs_extra_1.rm)(destination).catch(() => { });
    }
});
exports.getProjectDependencyTree = getProjectDependencyTree;
/**
 * Returns the lowest version of a package installed.
 *
 * @param packageName - The name of the package to get the lowest version for
 * @param dependencyTree - The dependency tree including all package versions
 * @returns The lowest version of the given package that is installed
 */
const getLowestPackageVersion = (packageName, dependencyTree) => {
    let lowestVersion = null;
    function search(tree) {
        for (const key in tree.dependencies) {
            const dependency = tree.dependencies[key];
            if (key === packageName) {
                const version = dependency.version;
                if (!lowestVersion || semver_1.default.lt(version, lowestVersion)) {
                    lowestVersion = version;
                }
            }
            if (dependency.dependencies) {
                search(dependency);
            }
        }
    }
    search(dependencyTree);
    return lowestVersion !== null && lowestVersion !== void 0 ? lowestVersion : 'unknown';
};
exports.getLowestPackageVersion = getLowestPackageVersion;
/**
 * Returns the versions of all PWA Kit dependencies of a project.
 * This will search the dependency tree for the lowest version of each PWA Kit package.
 *
 * @param dependencyTree - The dependency tree including all package versions
 * @returns The versions of all dependencies of the project.
 */
const getPwaKitDependencies = (dependencyTree) => {
    const pwaKitDependencies = [
        '@salesforce/pwa-kit-react-sdk',
        '@salesforce/pwa-kit-runtime',
        '@salesforce/pwa-kit-dev'
    ];
    // pwa-kit package versions are not always listed as direct dependencies
    // in the package.json such as when a bundle is using template extensibility
    const nestedPwaKitDependencies = {};
    pwaKitDependencies.forEach((packageName) => {
        nestedPwaKitDependencies[packageName] = (0, exports.getLowestPackageVersion)(packageName, dependencyTree);
    });
    return nestedPwaKitDependencies;
};
exports.getPwaKitDependencies = getPwaKitDependencies;
class CloudAPIClient {
    constructor(params) {
        this.opts = {
            origin: params.origin || exports.DEFAULT_CLOUD_ORIGIN,
            fetch: params.fetch || node_fetch_1.default,
            credentials: params.credentials
        };
    }
    getAuthHeader() {
        const { username, api_key } = this.opts.credentials;
        const encoded = Buffer.from(`${username}:${api_key}`, 'binary').toString('base64');
        return { Authorization: `Basic ${encoded}` };
    }
    getHeaders() {
        return __awaiter(this, void 0, void 0, function* () {
            const pkg = yield (0, exports.getPkgJSON)();
            return Object.assign({ 'User-Agent': `${pkg.name}@${pkg.version}` }, this.getAuthHeader());
        });
    }
    throwForStatus(res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (res.status < 400) {
                return;
            }
            const body = yield res.text();
            let error;
            try {
                error = JSON.parse(body);
            }
            catch (_a) {
                error = {}; // Cloud doesn't always return JSON
            }
            if (res.status === 403) {
                error.docs_url =
                    'https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/mrt-overview.html#users,-abilities,-and-roles';
            }
            throw new Error([
                `HTTP ${res.status}`,
                error.message || body,
                `For more information visit ${error.docs_url || exports.DEFAULT_DOCS_URL}`
            ].join('\n'));
        });
    }
    push(bundle, projectSlug, target) {
        return __awaiter(this, void 0, void 0, function* () {
            const base = `api/projects/${projectSlug}/builds/`;
            const pathname = target ? base + `${target}/` : base;
            const url = new url_1.URL(this.opts.origin);
            url.pathname = pathname;
            const body = Buffer.from(JSON.stringify(bundle));
            const headers = Object.assign(Object.assign({}, (yield this.getHeaders())), { 'Content-Length': body.length.toString() });
            const res = yield this.opts.fetch(url.toString(), {
                body,
                method: 'POST',
                headers
            });
            yield this.throwForStatus(res);
            return yield res.json();
        });
    }
    createLoggingToken(project, environment) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = new url_1.URL(this.opts.origin);
            url.pathname = `/api/projects/${project}/target/${environment}/jwt/`;
            const headers = Object.assign(Object.assign({}, (yield this.getHeaders())), { 
                // Annoyingly, the new logging endpoint only accepts an
                // Authorization header that is inconsistent with our older APIs!
                Authorization: `Bearer ${this.opts.credentials.api_key}` });
            const res = yield this.opts.fetch(url.toString(), {
                method: 'POST',
                headers
            });
            yield this.throwForStatus(res);
            const data = yield res.json();
            return data['token'];
        });
    }
    /** Polls MRT for deployment status every 30 seconds. */
    waitForDeploy(project, environment) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                /** Milliseconds to wait between checks. */
                const delay = 30000;
                /** Check the deployment status to see whether it has finished. */
                const check = () => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    const url = new url_1.URL(`/api/projects/${project}/target/${environment}`, this.opts.origin);
                    const res = yield this.opts.fetch(url, { headers: yield this.getHeaders() });
                    if (!res.ok) {
                        const text = yield res.text();
                        let json;
                        try {
                            if (text)
                                json = JSON.parse(text);
                        }
                        catch (_) { } // eslint-disable-line no-empty
                        const message = (_a = json === null || json === void 0 ? void 0 : json.detail) !== null && _a !== void 0 ? _a : text;
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        const detail = message ? `: ${message}` : '';
                        throw new Error(`${res.status} ${res.statusText}${detail}`);
                    }
                    const data = yield res.json();
                    if (typeof data.state !== 'string') {
                        return reject(new Error('An unknown state occurred when polling the deployment.'));
                    }
                    switch (data.state) {
                        case 'CREATE_IN_PROGRESS':
                        case 'PUBLISH_IN_PROGRESS':
                            // In progress - check again after the next delay
                            // `check` is async, so we need to use .catch to properly handle errors
                            setTimeout(() => void check().catch(reject), delay);
                            return;
                        case 'CREATE_FAILED':
                        case 'PUBLISH_FAILED':
                            // Failed - reject with failure
                            return reject(new Error('Deployment failed.'));
                        case 'ACTIVE':
                            // Success!
                            return resolve();
                        default:
                            // Unknown - reject with confusion
                            return reject(new Error(`Unknown deployment state "${data.state}".`));
                    }
                });
                // Start checking after the first delay!
                setTimeout(() => void check().catch(reject), delay);
            });
        });
    }
}
exports.CloudAPIClient = CloudAPIClient;
const defaultMessage = (gitInstance = git_rev_sync_1.default) => {
    try {
        return `${gitInstance.branch()}: ${gitInstance.short()}`;
    }
    catch (err) {
        if ((err === null || err === void 0 ? void 0 : err.code) === 'ENOENT') {
            console.log('Using default bundle message as no message was provided and not in a Git repo.');
        }
        return 'PWA Kit Bundle';
    }
};
exports.defaultMessage = defaultMessage;
const createBundle = ({ message, ssr_parameters, ssr_only, ssr_shared, buildDirectory, projectSlug }) => __awaiter(void 0, void 0, void 0, function* () {
    message = message || (0, exports.defaultMessage)();
    const tmpDir = yield (0, fs_extra_1.mkdtemp)(path_1.default.join(os_1.default.tmpdir(), 'pwa-kit-dev-'));
    const destination = path_1.default.join(tmpDir, 'build.tar');
    const filesInArchive = [];
    let bundle_metadata = {};
    if (ssr_only.length === 0 || ssr_shared.length === 0) {
        throw new Error('no ssrOnly or ssrShared files are defined');
    }
    return (Promise.resolve()
        .then(() => (0, fs_extra_1.stat)(buildDirectory))
        .catch(() => {
        const fullPath = path_1.default.join(process.cwd(), buildDirectory);
        throw new Error(`Build directory at path "${fullPath}" not found.\n` +
            'Run `pwa-kit-dev build` first!');
    })
        .then(() => new Promise((resolve, reject) => {
        const output = (0, fs_extra_1.createWriteStream)(destination);
        const archive = (0, archiver_1.default)('tar');
        archive.pipe(output);
        // See https://web.archive.org/web/20160712064705/http://archiverjs.com/docs/global.html#TarEntryData
        const newRoot = path_1.default.join(projectSlug, 'bld', '');
        // WARNING: There are a lot of type assertions here because we use a very old
        // version of archiver, and the types provided don't match the docs. :\
        archive.directory(buildDirectory, '', ((entry) => {
            const stats = entry.stats;
            if ((stats === null || stats === void 0 ? void 0 : stats.isFile()) && entry.name) {
                filesInArchive.push(entry.name);
            }
            entry.prefix = newRoot;
            return entry;
        }));
        archive.on('error', reject);
        output.on('finish', resolve);
        archive.finalize();
    }))
        .then(() => __awaiter(void 0, void 0, void 0, function* () {
        const { dependencies = {}, devDependencies = {}, ccExtensibility = { extends: '', overridesDir: '' } } = yield (0, exports.getProjectPkg)();
        const extendsTemplate = 'node_modules/' + ccExtensibility.extends;
        let cc_overrides = [];
        if (ccExtensibility.overridesDir) {
            const overrides_files = yield (0, exports.walkDir)(ccExtensibility.overridesDir, ccExtensibility.overridesDir);
            cc_overrides = Array.from(overrides_files).filter((item) => (0, fs_extra_1.existsSync)(path_1.default.join(extendsTemplate, item)));
        }
        const dependencyTree = yield (0, exports.getProjectDependencyTree)();
        // If we can't load the dependency tree, pretend that it's empty.
        // TODO: Should we report an error?
        const pwaKitDeps = dependencyTree ? (0, exports.getPwaKitDependencies)(dependencyTree) : {};
        bundle_metadata = {
            dependencies: Object.assign(Object.assign(Object.assign({}, dependencies), devDependencies), (pwaKitDeps !== null && pwaKitDeps !== void 0 ? pwaKitDeps : {})),
            cc_overrides: cc_overrides
        };
    }))
        .then(() => (0, fs_extra_1.readFile)(destination))
        .then((data) => {
        const encoding = 'base64';
        return {
            message,
            encoding,
            data: data.toString(encoding),
            ssr_parameters,
            ssr_only: filesInArchive.filter((0, exports.glob)(ssr_only)),
            ssr_shared: filesInArchive.filter((0, exports.glob)(ssr_shared)),
            bundle_metadata
        };
    })
        // This is a false positive. The promise returned by `.finally()` won't resolve until
        // the `rm()` completes!
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        .finally(() => (0, fs_extra_1.rm)(tmpDir, { recursive: true })));
});
exports.createBundle = createBundle;
const glob = (patterns) => {
    // The patterns can include negations, so matching is done against all
    // the patterns. A match is true if a given path matches any pattern and
    // does not match any negating patterns.
    const allPatterns = (patterns || [])
        .map((pattern) => new minimatch_1.Minimatch(pattern, { nocomment: true }))
        .filter((pattern) => !pattern.empty);
    const positivePatterns = allPatterns.filter((pattern) => !pattern.negate);
    const negativePatterns = allPatterns.filter((pattern) => pattern.negate);
    return (path) => {
        if (path) {
            const positive = positivePatterns.some((pattern) => pattern.match(path));
            const negative = negativePatterns.some((pattern) => !pattern.match(path));
            return positive && !negative;
        }
        return false;
    };
};
exports.glob = glob;
const getCredentialsFile = (cloudOrigin, credentialsFile) => {
    if (credentialsFile) {
        return credentialsFile;
    }
    else {
        const url = new url_1.URL(cloudOrigin);
        const host = url.host;
        const suffix = host === 'cloud.mobify.com' ? '' : `--${host}`;
        return path_1.default.join(os_1.default.homedir(), `.mobify${suffix}`);
    }
};
exports.getCredentialsFile = getCredentialsFile;
const readCredentials = (filepath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, fs_extra_1.readJson)(filepath);
        return {
            username: data.username,
            api_key: data.api_key
        };
    }
    catch (e) {
        throw new Error(`Credentials file "${filepath}" not found.\n` +
            'Visit https://runtime.commercecloud.com/account/settings for ' +
            'steps on authorizing your computer to push bundles.');
    }
});
exports.readCredentials = readCredentials;
const parseLog = (log) => {
    var _a;
    const parts = log.trim().split('\t');
    let requestId, shortRequestId, level;
    if (parts.length >= 3 &&
        validator_1.default.isISO8601(parts[0]) &&
        validator_1.default.isUUID(parts[1]) &&
        validator_1.default.isAlpha(parts[2])) {
        // An application log
        parts.shift();
        requestId = parts.shift();
        level = parts.shift();
    }
    else {
        // A platform log
        const words = parts[0].split(' ');
        level = words.shift();
        parts[0] = words.join(' ');
    }
    const message = parts.join('\t');
    const match = /(?<id>[a-f\d]{8})/.exec(requestId || message);
    if (match) {
        shortRequestId = (_a = match.groups) === null || _a === void 0 ? void 0 : _a.id;
    }
    return { level, message, shortRequestId };
};
exports.parseLog = parseLog;
