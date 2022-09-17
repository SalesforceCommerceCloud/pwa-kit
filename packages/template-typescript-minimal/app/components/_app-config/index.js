import {withLegacyGetProps} from 'pwa-kit-react-sdk/ssr/universal/withLegacyGetProps'
import {withReactQuery} from 'pwa-kit-react-sdk/ssr/universal/withReactQuery'
import AppConfig from 'pwa-kit-react-sdk/ssr/universal/components/_app-config'


export default withReactQuery(withLegacyGetProps(AppConfig))
