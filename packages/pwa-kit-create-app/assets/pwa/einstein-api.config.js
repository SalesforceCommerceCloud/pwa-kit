// We are using a different site Id for Einstein
// as we believe there’s some limitations in standing up einstein on on-demand sandboxes,
// so this was the same matching data set
// this need to be changed to the site id in the commerce api config file

exports.template = ({einsteinId, siteId, proxyPath}) => `export const einsteinAPIConfig = {
    proxyPath: \`/mobify/proxy/${proxyPath}\`,
    einsteinId: '${einsteinId}',
    siteId: '${siteId}'
}
`
