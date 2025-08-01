import 'server-only'
import {createServerContext} from './serverContext'

export const RequestContext = createServerContext<Request | null>(null)
