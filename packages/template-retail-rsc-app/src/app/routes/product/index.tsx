import type {LoaderFunctionArgs} from 'react-router'

export async function loader({params}: LoaderFunctionArgs): Promise<unknown> {
    const {productId} = params
    return productId
}

export default function Product({loaderData}: {loaderData: string}) {
    return <>Product: {loaderData}</>
}
