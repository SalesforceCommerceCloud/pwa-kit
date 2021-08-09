/* eslint import/no-commonjs:0 no-useless-escape:0*/

const childProcess = require('child_process')
const path = require('path')
const fs = require('fs')
const fsExtra = require('fs-extra')
const generator = require('./mobify-generator')
const shell = require('shelljs')

jest.setTimeout(100000)

// A test that only runs for integration test runs
const integrationTest = process.env.TEST_TYPE === 'integration' ? test : test.skip

describe(`The project generator`, () => {
    integrationTest(`Should generate a working Mobify project`, () => {
        const projectPath = generator.main({
            preset: 'test-project-bundled'
        })
        childProcess.execSync(`npm ci`, {cwd: projectPath})
        childProcess.execSync(`npm run lint`, {cwd: projectPath})
        childProcess.execSync(`npm run lerna -- run prod:build`, {cwd: projectPath})
        const mainJS = path.resolve(projectPath, 'packages', 'pwa', 'build', 'main.js')
        // Check that the project built
        expect(fs.existsSync(mainJS)).toBe(true)

        // Check there are no references to merlins
        // l: only print the file name the match was found from
        // i: ignore case
        const paths = [
            `${projectPath}/!(node_modules|packages)/**/*.*`,
            `${projectPath}/*.*`,
            `${projectPath}/packages/+(connector|pwa)/!(node_modules)/*.*`,
            `${projectPath}/packages/+(connector|pwa)/*.*`
        ]

        const result = shell.grep('-li', 'merlins', paths)

        // If this test fails due to remaining references to 'merlins', the error message will print out
        // the file path(s) of the generated project that the 'merlins' references have been found in.
        expect(result.stdout.toString().trim()).toBeFalsy()
    })

    integrationTest(`Should whitelist and replace package data by default`, () => {
        const projectPath = generator.main({
            preset: 'test-project'
        })
        const packagesDir = path.join(projectPath, 'packages')
        const includedPackages = fs.readdirSync(packagesDir).map((dir) => {
            const pkgPath = path.resolve(packagesDir, dir)
            const pkgJsonPath = path.resolve(pkgPath, 'package.json')
            const pkg = fsExtra.readJsonSync(pkgJsonPath)
            return {[pkg.name]: pkg}
        })
        const foundPackageData = Object.assign({}, ...includedPackages)

        // We need to filter out the 'globals' key from generator.testProjectAnswers because 'globals'
        // is not a package in the monorepo
        const testProjectAnswers = Object.keys(generator.testProjectAnswers)
            .filter((key) => key !== 'globals')
            .map((key) => generator.testProjectAnswers[key])

        // Should include the same number of packages as present in the whitelist.
        expect(Object.keys(foundPackageData).length).toEqual(Object.keys(testProjectAnswers).length)

        // Should overwrite values in the generated packages' package.json file.
        Object.keys(testProjectAnswers).forEach((originalPkgName) => {
            const replacements = testProjectAnswers[originalPkgName]
            const actual = foundPackageData[replacements.name]
            expect(actual.name).toEqual(replacements.name)
            expect(actual.version).toEqual(replacements.version)
        })
    })
})
