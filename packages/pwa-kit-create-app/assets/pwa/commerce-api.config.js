exports.template = ({
    proxyPath,
    clientId,
    organizationId,
    shortCode,
    siteId
}) => `export const commerceAPIConfig = {
    proxyPath: \`/mobify/proxy/${proxyPath}\`,
    parameters: {
        clientId: '${clientId}',
        organizationId: '${organizationId}',
        shortCode: '${shortCode}',
        siteId: '${siteId}'
    }
}
`
