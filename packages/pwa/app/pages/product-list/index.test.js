import ProductList from './index'

test('Product List Page', () => {
    // This is where you'll add unit tests for your pages. But usually you'll
    // want to create e2e tests for page coverage.
    expect(typeof ProductList.getTemplateName()).toEqual('string')
})
