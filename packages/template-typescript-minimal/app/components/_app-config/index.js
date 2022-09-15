import {withLegacyGetProps} from 'pwa-kit-react-sdk/ssr/universal/components/_app-config/withLegacyGetProps'
import {withReactQuery} from 'pwa-kit-react-sdk/ssr/universal/components/_app-config/withReactQuery'
import AppConfig from 'pwa-kit-react-sdk/ssr/universal/components/_app-config'

export default withReactQuery(withLegacyGetProps(AppConfig))
