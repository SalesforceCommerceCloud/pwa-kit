const reports = [
    require('../build/request-processor-report.json'),
    require('../build/pwa-others-report.json'),
    require('../build/client-report.json'),
    require('../build/ssr-report.json'),
    require('../build/server-report.json')
]
    .map((report) => JSON.stringify(report))
    .join('')

const package = require('../package.json')
const dependencies = Object.keys({
    ...package.dependencies,
    ...package.devDependencies
})

const foundInABundle = []
const notFoundInABundle = []

dependencies.forEach((dep) => {
    const found = new RegExp(`/${dep}/`).test(reports)
    if (found) {
        foundInABundle.push(dep)
    } else {
        notFoundInABundle.push(dep)
    }
})

console.log('Modules found in a bundle:', foundInABundle)
console.log('Modules NOT found in a bundle:', notFoundInABundle)
