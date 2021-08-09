import {CookieJar, CookieAccessInfo} from 'cookiejar'
import {ScrapingConnector} from './scraping-connector'

describe(`Cookie utilities`, () => {
    const byName = (a, b) => (a.name > b.name ? 1 : -1)
    const toObj = (cookie) => Object.assign({}, cookie)

    test('cloneCookieJar should clone a cookie jar', () => {
        const j1 = new CookieJar()
        j1.setCookie('PHPSESSID=12345; path=/; domain=www.merlinspotions.com; HttpOnly')
        j1.setCookie('sandy-client-id=67890')
        j1.setCookie('_ga=121212')
        const j2 = ScrapingConnector.cloneCookieJar(j1)
        const c1 = j1
            .getCookies(CookieAccessInfo.All)
            .map(toObj)
            .sort(byName)
        const c2 = j2
            .getCookies(CookieAccessInfo.All)
            .map(toObj)
            .sort(byName)
        expect(c1.length).toEqual(3)
        expect(c1).toEqual(c2)
    })

    test('diffCookieJar should return only new/changed cookies', () => {
        const j1 = new CookieJar()
        j1.setCookie('PHPSESSID=12345; path=/; domain=www.merlinspotions.com; HttpOnly')
        j1.setCookie('cookie-will-change=foo')

        const j2 = ScrapingConnector.cloneCookieJar(j1)
        j2.setCookie('cookie-will-change=foo-changed')
        j2.setCookie('brand-new-cookie=new; domain=www.merlinspotions.com; path=/; secure')
        const diff = ScrapingConnector.diffCookieJars(j1, j2)
            .map(toObj)
            .sort(byName)
        expect(diff).toEqual([
            {
                domain: 'www.merlinspotions.com',
                expiration_date: Infinity,
                explicit_domain: true,
                explicit_path: true,
                name: 'brand-new-cookie',
                noscript: false,
                path: '/',
                secure: true,
                value: 'new'
            },
            {
                domain: undefined,
                expiration_date: Infinity,
                explicit_domain: false,
                explicit_path: false,
                name: 'cookie-will-change',
                noscript: false,
                path: '/',
                secure: false,
                value: 'foo-changed'
            }
        ])
    })

    test('rewriteCookieDomain should conditionally rewrite proxied cookies', () => {
        const jar = new CookieJar()
        jar.setCookie('a=a; domain=www.merlinspotions.com; HttpOnly; secure')
        jar.setCookie('b=b; domain=something-else.com')
        jar.setCookie('c=c')
        const cookies = jar.getCookies(CookieAccessInfo.All)
        const rewritten = cookies
            .map((cookie) =>
                ScrapingConnector.rewriteCookieDomain(
                    {'www.merlinspotions.com': 'www.merlinsproxy.com'},
                    cookie
                )
            )
            .map(toObj)
            .sort(byName)
        const expected = [
            {
                domain: 'www.merlinsproxy.com',
                expiration_date: Infinity,
                explicit_domain: true,
                explicit_path: false,
                name: 'a',
                noscript: true,
                path: '/',
                secure: true,
                value: 'a'
            },
            {
                domain: 'something-else.com',
                expiration_date: Infinity,
                explicit_domain: true,
                explicit_path: false,
                name: 'b',
                noscript: false,
                path: '/',
                secure: false,
                value: 'b'
            },
            {
                domain: undefined,
                expiration_date: Infinity,
                explicit_domain: false,
                explicit_path: false,
                name: 'c',
                noscript: false,
                path: '/',
                secure: false,
                value: 'c'
            }
        ]
        expect(rewritten).toEqual(expected)
    })
})
