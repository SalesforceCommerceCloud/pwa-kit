const {exec, execSync} = require('child_process')

const getBucket = (env) => (env === 'production' ? 'docs.mobify.com' : `docs-${env}.mobify.com`)
const getUrl = (env) => {
    // Testing environment doesn't have a domain name set
    if (env === 'testing') return `docs-${env}.mobify.com.s3-website-us-east-1.amazonaws.com`

    return `https://${getBucket(env)}`
}
const getCloudFrontDistributionId = (env) => {
    switch (env) {
        case 'production':
            return 'EWTUW3ELN40OC'
        case 'staging':
            return 'E1MKZCJ6791YMP'
        default:
            return false
    }
}
const errorAndFail = (errorObject, message) => {
    console.log(message)
    console.error(errorObject)
    process.exit(1)
}

const deploy = (folder, project, env) => {
    // Documentation-hub is uploaded to the root of the docs S3 bucket, so it
    // doesn't need a project folder name
    const projectName = project !== 'docs-hub' ? project : ''
    const s3Bucket = getBucket(env)
    const s3Location = `${s3Bucket}/${projectName}`

    console.log(`Deploying "${project}" documentation to ${env} environment (s3://${s3Location})`)

    return new Promise((resolve) => {
        exec(
            `aws s3 cp --recursive \
            --acl public-read \
            --cache-control 'public,max-age=300' \
            --exclude "*" \
            --include "*.css" \
            --include "*.scss" \
            --include "*.html" \
            --include "*.xml" \
            --include "*.js" \
            --include "*.json" \
            --include "*.png" \
            --include "*.jpg" \
            --include "*.jpeg" \
            --include "*.gif" \
            --include "*.svg" \
            --include "*.ico" \
            --include "*.woff" \
            --include "*.otf" \
            --include "*.ttf" \
            ${folder} s3://${s3Location}`,
            {maxBuffer: 1024 * 2000}, // 2MB maximum buffer, default is 1024 * 200 (i.e. 200KB)
            (e, stdout, stderr) => {
                if (e) {
                    errorAndFail(e, 'Error occurred during deployment to S3:')
                }

                console.log('Deployment successful')
                console.log(`Documentation available at: ${getUrl(env)}/${projectName}`)
                resolve()
            }
        )
    }).then(() => {
        // Returns `false` if environment has no CloudFront distribution
        var distId = getCloudFrontDistributionId(env)

        if (!distId) {
            return
        }

        console.log(`Invalidating CloudFront distribution "${distId}" (${env})`)

        // Running this synchronously since order is important and it carries out
        // very little work (i.e. is just a configuration change)
        execSync('aws configure set preview.cloudfront true')

        exec(
            `aws cloudfront create-invalidation --distribution-id ${distId} --paths "/*"`,
            (e, stdout, stderr) => {
                if (e) {
                    errorAndFail(e, 'Error occurred during CloudFront invalidation:')
                }

                // Invalidation takes some time so messaging that it's done here
                // would be inaccurate
            }
        )
    })
}

module.exports = deploy
