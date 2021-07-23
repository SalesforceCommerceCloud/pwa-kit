#!/usr/bin/env node
/* eslint-env node */

const childProc = require('child_process')

/**
 * Use gnu-time to report stats about a build step to Datadog
 */
const main = () => {
    const cmd = process.argv[3]
    const args = process.argv.slice(4)
    const metricName = process.argv[2]
    const format = '{"max_memory_kb": "%M", "max_cpu_percent": "%P", "wall_time_seconds": "%e"}'

    const {status, stderr} = childProc.spawnSync('/usr/bin/time', ['-f', format, cmd, ...args], {
        stdio: ['inherit', 'inherit', 'pipe']
    })

    const err = stderr.toString().trim()
    console.error(err)

    const errorLines = err.split('\n')
    const last = errorLines[errorLines.length - 1]
    const data = JSON.parse(last)

    Object.keys(data).forEach((k) => {
        const metric = `mobify_platform_sdks.${metricName}_${k}`
        const value = parseFloat(data[k])
        childProc.spawnSync('dog', [
            'metric',
            'post',
            metric,
            value
        ])
        console.log(
            `dog metric post ${metric} ${value}`
        )
    })
    process.exit(status)
}

main()
