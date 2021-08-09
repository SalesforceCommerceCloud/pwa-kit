/* PrismJS 1.15.0
https://prismjs.com/download.html?#themes=prism&languages=markup+css+clike+javascript+c+bash+coffeescript+diff+git+json+markdown+scss+jsx+sass&plugins=line-highlight+line-numbers+file-highlight+toolbar+highlight-keywords+command-line+normalize-whitespace+copy-to-clipboard */
var _self =
        'undefined' != typeof window
            ? window
            : 'undefined' != typeof WorkerGlobalScope && self instanceof WorkerGlobalScope
            ? self
            : {},
    Prism = (function() {
        var e = /\blang(?:uage)?-([\w-]+)\b/i,
            t = 0,
            a = (_self.Prism = {
                manual: _self.Prism && _self.Prism.manual,
                disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
                util: {
                    encode: function(e) {
                        return e instanceof n
                            ? new n(e.type, a.util.encode(e.content), e.alias)
                            : 'Array' === a.util.type(e)
                            ? e.map(a.util.encode)
                            : e
                                  .replace(/&/g, '&amp;')
                                  .replace(/</g, '&lt;')
                                  .replace(/\u00a0/g, ' ')
                    },
                    type: function(e) {
                        return Object.prototype.toString.call(e).slice(8, -1)
                    },
                    objId: function(e) {
                        return e.__id || Object.defineProperty(e, '__id', {value: ++t}), e.__id
                    },
                    clone: function i(e, t) {
                        var n,
                            r,
                            l = a.util.type(e)
                        switch (((t = t || {}), l)) {
                            case 'Object':
                                if (((r = a.util.objId(e)), t[r])) return t[r]
                                ;(n = {}), (t[r] = n)
                                for (var o in e) e.hasOwnProperty(o) && (n[o] = i(e[o], t))
                                return n
                            case 'Array':
                                return (
                                    (r = a.util.objId(e)),
                                    t[r]
                                        ? t[r]
                                        : ((n = []),
                                          (t[r] = n),
                                          e.forEach(function(e, a) {
                                              n[a] = i(e, t)
                                          }),
                                          n)
                                )
                            default:
                                return e
                        }
                    }
                },
                languages: {
                    extend: function(e, t) {
                        var n = a.util.clone(a.languages[e])
                        for (var r in t) n[r] = t[r]
                        return n
                    },
                    insertBefore: function(e, t, n, r) {
                        r = r || a.languages
                        var i = r[e],
                            l = {}
                        for (var o in i)
                            if (i.hasOwnProperty(o)) {
                                if (o == t) for (var s in n) n.hasOwnProperty(s) && (l[s] = n[s])
                                n.hasOwnProperty(o) || (l[o] = i[o])
                            }
                        var u = r[e]
                        return (
                            (r[e] = l),
                            a.languages.DFS(a.languages, function(t, a) {
                                a === u && t != e && (this[t] = l)
                            }),
                            l
                        )
                    },
                    DFS: function l(e, t, n, r) {
                        r = r || {}
                        var i = a.util.objId
                        for (var o in e)
                            if (e.hasOwnProperty(o)) {
                                t.call(e, o, e[o], n || o)
                                var s = e[o],
                                    u = a.util.type(s)
                                'Object' !== u || r[i(s)]
                                    ? 'Array' !== u || r[i(s)] || ((r[i(s)] = !0), l(s, t, o, r))
                                    : ((r[i(s)] = !0), l(s, t, null, r))
                            }
                    }
                },
                plugins: {},
                highlightAll: function(e, t) {
                    a.highlightAllUnder(document, e, t)
                },
                highlightAllUnder: function(e, t, n) {
                    var r = {
                        callback: n,
                        selector:
                            'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
                    }
                    a.hooks.run('before-highlightall', r)
                    for (
                        var i, l = r.elements || e.querySelectorAll(r.selector), o = 0;
                        (i = l[o++]);

                    )
                        a.highlightElement(i, t === !0, r.callback)
                },
                highlightElement: function(t, n, r) {
                    for (var i, l, o = t; o && !e.test(o.className); ) o = o.parentNode
                    o &&
                        ((i = (o.className.match(e) || [, ''])[1].toLowerCase()),
                        (l = a.languages[i])),
                        (t.className =
                            t.className.replace(e, '').replace(/\s+/g, ' ') + ' language-' + i),
                        t.parentNode &&
                            ((o = t.parentNode),
                            /pre/i.test(o.nodeName) &&
                                (o.className =
                                    o.className.replace(e, '').replace(/\s+/g, ' ') +
                                    ' language-' +
                                    i))
                    var s = t.textContent,
                        u = {element: t, language: i, grammar: l, code: s},
                        g = function(e) {
                            ;(u.highlightedCode = e),
                                a.hooks.run('before-insert', u),
                                (u.element.innerHTML = u.highlightedCode),
                                a.hooks.run('after-highlight', u),
                                a.hooks.run('complete', u),
                                r && r.call(u.element)
                        }
                    if ((a.hooks.run('before-sanity-check', u), !u.code))
                        return a.hooks.run('complete', u), void 0
                    if ((a.hooks.run('before-highlight', u), !u.grammar))
                        return g(a.util.encode(u.code)), void 0
                    if (n && _self.Worker) {
                        var c = new Worker(a.filename)
                        ;(c.onmessage = function(e) {
                            g(e.data)
                        }),
                            c.postMessage(
                                JSON.stringify({
                                    language: u.language,
                                    code: u.code,
                                    immediateClose: !0
                                })
                            )
                    } else g(a.highlight(u.code, u.grammar, u.language))
                },
                highlight: function(e, t, r) {
                    var i = {code: e, grammar: t, language: r}
                    return (
                        a.hooks.run('before-tokenize', i),
                        (i.tokens = a.tokenize(i.code, i.grammar)),
                        a.hooks.run('after-tokenize', i),
                        n.stringify(a.util.encode(i.tokens), i.language)
                    )
                },
                matchGrammar: function(e, t, n, r, i, l, o) {
                    var s = a.Token
                    for (var u in n)
                        if (n.hasOwnProperty(u) && n[u]) {
                            if (u == o) return
                            var g = n[u]
                            g = 'Array' === a.util.type(g) ? g : [g]
                            for (var c = 0; c < g.length; ++c) {
                                var f = g[c],
                                    h = f.inside,
                                    d = !!f.lookbehind,
                                    m = !!f.greedy,
                                    p = 0,
                                    y = f.alias
                                if (m && !f.pattern.global) {
                                    var v = f.pattern.toString().match(/[imuy]*$/)[0]
                                    f.pattern = RegExp(f.pattern.source, v + 'g')
                                }
                                f = f.pattern || f
                                for (var k = r, b = i; k < t.length; b += t[k].length, ++k) {
                                    var w = t[k]
                                    if (t.length > e.length) return
                                    if (!(w instanceof s)) {
                                        if (m && k != t.length - 1) {
                                            f.lastIndex = b
                                            var _ = f.exec(e)
                                            if (!_) break
                                            for (
                                                var P = _.index + (d ? _[1].length : 0),
                                                    A = _.index + _[0].length,
                                                    O = k,
                                                    x = b,
                                                    N = t.length;
                                                N > O &&
                                                (A > x || (!t[O].type && !t[O - 1].greedy));
                                                ++O
                                            )
                                                (x += t[O].length), P >= x && (++k, (b = x))
                                            if (t[k] instanceof s) continue
                                            ;(j = O - k), (w = e.slice(b, x)), (_.index -= b)
                                        } else {
                                            f.lastIndex = 0
                                            var _ = f.exec(w),
                                                j = 1
                                        }
                                        if (_) {
                                            d && (p = _[1] ? _[1].length : 0)
                                            var P = _.index + p,
                                                _ = _[0].slice(p),
                                                A = P + _.length,
                                                S = w.slice(0, P),
                                                E = w.slice(A),
                                                C = [k, j]
                                            S && (++k, (b += S.length), C.push(S))
                                            var M = new s(u, h ? a.tokenize(_, h) : _, y, _, m)
                                            if (
                                                (C.push(M),
                                                E && C.push(E),
                                                Array.prototype.splice.apply(t, C),
                                                1 != j && a.matchGrammar(e, t, n, k, b, !0, u),
                                                l)
                                            )
                                                break
                                        } else if (l) break
                                    }
                                }
                            }
                        }
                },
                tokenize: function(e, t) {
                    var n = [e],
                        r = t.rest
                    if (r) {
                        for (var i in r) t[i] = r[i]
                        delete t.rest
                    }
                    return a.matchGrammar(e, n, t, 0, 0, !1), n
                },
                hooks: {
                    all: {},
                    add: function(e, t) {
                        var n = a.hooks.all
                        ;(n[e] = n[e] || []), n[e].push(t)
                    },
                    run: function(e, t) {
                        var n = a.hooks.all[e]
                        if (n && n.length) for (var r, i = 0; (r = n[i++]); ) r(t)
                    }
                }
            }),
            n = (a.Token = function(e, t, a, n, r) {
                ;(this.type = e),
                    (this.content = t),
                    (this.alias = a),
                    (this.length = 0 | (n || '').length),
                    (this.greedy = !!r)
            })
        if (
            ((n.stringify = function(e, t, r) {
                if ('string' == typeof e) return e
                if ('Array' === a.util.type(e))
                    return e
                        .map(function(a) {
                            return n.stringify(a, t, e)
                        })
                        .join('')
                var i = {
                    type: e.type,
                    content: n.stringify(e.content, t, r),
                    tag: 'span',
                    classes: ['token', e.type],
                    attributes: {},
                    language: t,
                    parent: r
                }
                if (e.alias) {
                    var l = 'Array' === a.util.type(e.alias) ? e.alias : [e.alias]
                    Array.prototype.push.apply(i.classes, l)
                }
                a.hooks.run('wrap', i)
                var o = Object.keys(i.attributes)
                    .map(function(e) {
                        return e + '="' + (i.attributes[e] || '').replace(/"/g, '&quot;') + '"'
                    })
                    .join(' ')
                return (
                    '<' +
                    i.tag +
                    ' class="' +
                    i.classes.join(' ') +
                    '"' +
                    (o ? ' ' + o : '') +
                    '>' +
                    i.content +
                    '</' +
                    i.tag +
                    '>'
                )
            }),
            !_self.document)
        )
            return _self.addEventListener
                ? (a.disableWorkerMessageHandler ||
                      _self.addEventListener(
                          'message',
                          function(e) {
                              var t = JSON.parse(e.data),
                                  n = t.language,
                                  r = t.code,
                                  i = t.immediateClose
                              _self.postMessage(a.highlight(r, a.languages[n], n)),
                                  i && _self.close()
                          },
                          !1
                      ),
                  _self.Prism)
                : _self.Prism
        var r =
            document.currentScript || [].slice.call(document.getElementsByTagName('script')).pop()
        return (
            r &&
                ((a.filename = r.src),
                a.manual ||
                    r.hasAttribute('data-manual') ||
                    ('loading' !== document.readyState
                        ? window.requestAnimationFrame
                            ? window.requestAnimationFrame(a.highlightAll)
                            : window.setTimeout(a.highlightAll, 16)
                        : document.addEventListener('DOMContentLoaded', a.highlightAll))),
            _self.Prism
        )
    })()
'undefined' != typeof module && module.exports && (module.exports = Prism),
    'undefined' != typeof global && (global.Prism = Prism)
;(Prism.languages.markup = {
    comment: /<!--[\s\S]*?-->/,
    prolog: /<\?[\s\S]+?\?>/,
    doctype: /<!DOCTYPE[\s\S]+?>/i,
    cdata: /<!\[CDATA\[[\s\S]*?]]>/i,
    tag: {
        pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s\/>])))+)?\s*\/?>/i,
        greedy: !0,
        inside: {
            tag: {
                pattern: /^<\/?[^\s>\/]+/i,
                inside: {punctuation: /^<\/?/, namespace: /^[^\s>\/:]+:/}
            },
            'attr-value': {
                pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/i,
                inside: {punctuation: [/^=/, {pattern: /^(\s*)["']|["']$/, lookbehind: !0}]}
            },
            punctuation: /\/?>/,
            'attr-name': {pattern: /[^\s>\/]+/, inside: {namespace: /^[^\s>\/:]+:/}}
        }
    },
    entity: /&#?[\da-z]{1,8};/i
}),
    (Prism.languages.markup.tag.inside['attr-value'].inside.entity = Prism.languages.markup.entity),
    Prism.hooks.add('wrap', function(a) {
        'entity' === a.type && (a.attributes.title = a.content.replace(/&amp;/, '&'))
    }),
    (Prism.languages.xml = Prism.languages.extend('markup', {})),
    (Prism.languages.html = Prism.languages.markup),
    (Prism.languages.mathml = Prism.languages.markup),
    (Prism.languages.svg = Prism.languages.markup)
;(Prism.languages.css = {
    comment: /\/\*[\s\S]*?\*\//,
    atrule: {pattern: /@[\w-]+?[\s\S]*?(?:;|(?=\s*\{))/i, inside: {rule: /@[\w-]+/}},
    url: /url\((?:(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
    selector: /[^{}\s][^{};]*?(?=\s*\{)/,
    string: {pattern: /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/, greedy: !0},
    property: /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
    important: /!important\b/i,
    function: /[-a-z0-9]+(?=\()/i,
    punctuation: /[(){};:,]/
}),
    (Prism.languages.css.atrule.inside.rest = Prism.languages.css),
    Prism.languages.markup &&
        (Prism.languages.insertBefore('markup', 'tag', {
            style: {
                pattern: /(<style[\s\S]*?>)[\s\S]*?(?=<\/style>)/i,
                lookbehind: !0,
                inside: Prism.languages.css,
                alias: 'language-css',
                greedy: !0
            }
        }),
        Prism.languages.insertBefore(
            'inside',
            'attr-value',
            {
                'style-attr': {
                    pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
                    inside: {
                        'attr-name': {
                            pattern: /^\s*style/i,
                            inside: Prism.languages.markup.tag.inside
                        },
                        punctuation: /^\s*=\s*['"]|['"]\s*$/,
                        'attr-value': {pattern: /.+/i, inside: Prism.languages.css}
                    },
                    alias: 'language-css'
                }
            },
            Prism.languages.markup.tag
        ))
Prism.languages.clike = {
    comment: [
        {pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/, lookbehind: !0},
        {pattern: /(^|[^\\:])\/\/.*/, lookbehind: !0, greedy: !0}
    ],
    string: {pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/, greedy: !0},
    'class-name': {
        pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,
        lookbehind: !0,
        inside: {punctuation: /[.\\]/}
    },
    keyword: /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
    boolean: /\b(?:true|false)\b/,
    function: /\w+(?=\()/,
    number: /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
    operator: /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
    punctuation: /[{}[\];(),.:]/
}
;(Prism.languages.javascript = Prism.languages.extend('clike', {
    'class-name': [
        Prism.languages.clike['class-name'],
        {
            pattern: /(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,
            lookbehind: !0
        }
    ],
    keyword: [
        {pattern: /((?:^|})\s*)(?:catch|finally)\b/, lookbehind: !0},
        /\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/
    ],
    number: /\b(?:(?:0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+)n?|\d+n|NaN|Infinity)\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][+-]?\d+)?/,
    function: /[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
    operator: /-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/
})),
    (Prism.languages.javascript[
        'class-name'
    ][0].pattern = /(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/),
    Prism.languages.insertBefore('javascript', 'keyword', {
        regex: {
            pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^\/\\\[\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})\]]))/,
            lookbehind: !0,
            greedy: !0
        },
        'function-variable': {
            pattern: /[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/,
            alias: 'function'
        },
        parameter: [
            {
                pattern: /(function(?:\s+[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\))/,
                lookbehind: !0,
                inside: Prism.languages.javascript
            },
            {
                pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/i,
                inside: Prism.languages.javascript
            },
            {
                pattern: /(\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*=>)/,
                lookbehind: !0,
                inside: Prism.languages.javascript
            },
            {
                pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*\{)/,
                lookbehind: !0,
                inside: Prism.languages.javascript
            }
        ],
        constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/
    }),
    Prism.languages.insertBefore('javascript', 'string', {
        'template-string': {
            pattern: /`(?:\\[\s\S]|\${[^}]+}|[^\\`])*`/,
            greedy: !0,
            inside: {
                interpolation: {
                    pattern: /\${[^}]+}/,
                    inside: {
                        'interpolation-punctuation': {pattern: /^\${|}$/, alias: 'punctuation'},
                        rest: Prism.languages.javascript
                    }
                },
                string: /[\s\S]+/
            }
        }
    }),
    Prism.languages.markup &&
        Prism.languages.insertBefore('markup', 'tag', {
            script: {
                pattern: /(<script[\s\S]*?>)[\s\S]*?(?=<\/script>)/i,
                lookbehind: !0,
                inside: Prism.languages.javascript,
                alias: 'language-javascript',
                greedy: !0
            }
        }),
    (Prism.languages.js = Prism.languages.javascript)
;(Prism.languages.c = Prism.languages.extend('clike', {
    'class-name': {pattern: /(\b(?:enum|struct)\s+)\w+/, lookbehind: !0},
    keyword: /\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/,
    operator: />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*\/%&|^!=<>]=?/,
    number: /(?:\b0x(?:[\da-f]+\.?[\da-f]*|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?)[ful]*/i
})),
    Prism.languages.insertBefore('c', 'string', {
        macro: {
            pattern: /(^\s*)#\s*[a-z]+(?:[^\r\n\\]|\\(?:\r\n|[\s\S]))*/im,
            lookbehind: !0,
            alias: 'property',
            inside: {
                string: {pattern: /(#\s*include\s*)(?:<.+?>|("|')(?:\\?.)+?\2)/, lookbehind: !0},
                directive: {
                    pattern: /(#\s*)\b(?:define|defined|elif|else|endif|error|ifdef|ifndef|if|import|include|line|pragma|undef|using)\b/,
                    lookbehind: !0,
                    alias: 'keyword'
                }
            }
        },
        constant: /\b(?:__FILE__|__LINE__|__DATE__|__TIME__|__TIMESTAMP__|__func__|EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|stdin|stdout|stderr)\b/
    }),
    delete Prism.languages.c['boolean']
!(function(e) {
    var a = {
        variable: [
            {
                pattern: /\$?\(\([\s\S]+?\)\)/,
                inside: {
                    variable: [{pattern: /(^\$\(\([\s\S]+)\)\)/, lookbehind: !0}, /^\$\(\(/],
                    number: /\b0x[\dA-Fa-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee]-?\d+)?/,
                    operator: /--?|-=|\+\+?|\+=|!=?|~|\*\*?|\*=|\/=?|%=?|<<=?|>>=?|<=?|>=?|==?|&&?|&=|\^=?|\|\|?|\|=|\?|:/,
                    punctuation: /\(\(?|\)\)?|,|;/
                }
            },
            {pattern: /\$\([^)]+\)|`[^`]+`/, greedy: !0, inside: {variable: /^\$\(|^`|\)$|`$/}},
            /\$(?:[\w#?*!@]+|\{[^}]+\})/i
        ]
    }
    e.languages.bash = {
        shebang: {pattern: /^#!\s*\/bin\/bash|^#!\s*\/bin\/sh/, alias: 'important'},
        comment: {pattern: /(^|[^"{\\])#.*/, lookbehind: !0},
        string: [
            {
                pattern: /((?:^|[^<])<<\s*)["']?(\w+?)["']?\s*\r?\n(?:[\s\S])*?\r?\n\2/,
                lookbehind: !0,
                greedy: !0,
                inside: a
            },
            {
                pattern: /(["'])(?:\\[\s\S]|\$\([^)]+\)|`[^`]+`|(?!\1)[^\\])*\1/,
                greedy: !0,
                inside: a
            }
        ],
        variable: a.variable,
        function: {
            pattern: /(^|[\s;|&])(?:add|alias|apropos|apt|apt-cache|apt-get|aptitude|aspell|automysqlbackup|awk|basename|bash|bc|bconsole|bg|builtin|bzip2|cal|cat|cd|cfdisk|chgrp|chkconfig|chmod|chown|chroot|cksum|clear|cmp|comm|command|cp|cron|crontab|csplit|curl|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|du|egrep|eject|enable|env|ethtool|eval|exec|expand|expect|export|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|getopts|git|gparted|grep|groupadd|groupdel|groupmod|groups|grub-mkconfig|gzip|halt|hash|head|help|hg|history|host|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|ip|jobs|join|kill|killall|less|link|ln|locate|logname|logout|logrotate|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|lynx|make|man|mc|mdadm|mkconfig|mkdir|mke2fs|mkfifo|mkfs|mkisofs|mknod|mkswap|mmv|more|most|mount|mtools|mtr|mutt|mv|nano|nc|netstat|nice|nl|nohup|notify-send|npm|nslookup|op|open|parted|passwd|paste|pathchk|ping|pkill|pnpm|popd|pr|printcap|printenv|printf|ps|pushd|pv|pwd|quota|quotacheck|quotactl|ram|rar|rcp|read|readarray|readonly|reboot|remsync|rename|renice|rev|rm|rmdir|rpm|rsync|scp|screen|sdiff|sed|sendmail|seq|service|sftp|shift|shopt|shutdown|sleep|slocate|sort|source|split|ssh|stat|strace|su|sudo|sum|suspend|swapon|sync|tail|tar|tee|test|time|timeout|times|top|touch|tr|traceroute|trap|tsort|tty|type|ulimit|umask|umount|unalias|uname|unexpand|uniq|units|unrar|unshar|unzip|update-grub|uptime|useradd|userdel|usermod|users|uudecode|uuencode|vdir|vi|vim|virsh|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yarn|yes|zip|zypper)(?=$|[\s;|&])/,
            lookbehind: !0
        },
        keyword: {
            pattern: /(^|[\s;|&])(?:let|:|\.|if|then|else|elif|fi|for|break|continue|while|in|case|function|select|do|done|until|echo|exit|return|set|declare)(?=$|[\s;|&])/,
            lookbehind: !0
        },
        boolean: {pattern: /(^|[\s;|&])(?:true|false)(?=$|[\s;|&])/, lookbehind: !0},
        operator: /&&?|\|\|?|==?|!=?|<<<?|>>|<=?|>=?|=~/,
        punctuation: /\$?\(\(?|\)\)?|\.\.|[{}[\];]/
    }
    var t = a.variable[1].inside
    ;(t.string = e.languages.bash.string),
        (t['function'] = e.languages.bash['function']),
        (t.keyword = e.languages.bash.keyword),
        (t['boolean'] = e.languages.bash['boolean']),
        (t.operator = e.languages.bash.operator),
        (t.punctuation = e.languages.bash.punctuation),
        (e.languages.shell = e.languages.bash)
})(Prism)
!(function(e) {
    var t = /#(?!\{).+/,
        n = {pattern: /#\{[^}]+\}/, alias: 'variable'}
    ;(e.languages.coffeescript = e.languages.extend('javascript', {
        comment: t,
        string: [
            {pattern: /'(?:\\[\s\S]|[^\\'])*'/, greedy: !0},
            {pattern: /"(?:\\[\s\S]|[^\\"])*"/, greedy: !0, inside: {interpolation: n}}
        ],
        keyword: /\b(?:and|break|by|catch|class|continue|debugger|delete|do|each|else|extend|extends|false|finally|for|if|in|instanceof|is|isnt|let|loop|namespace|new|no|not|null|of|off|on|or|own|return|super|switch|then|this|throw|true|try|typeof|undefined|unless|until|when|while|window|with|yes|yield)\b/,
        'class-member': {pattern: /@(?!\d)\w+/, alias: 'variable'}
    })),
        e.languages.insertBefore('coffeescript', 'comment', {
            'multiline-comment': {pattern: /###[\s\S]+?###/, alias: 'comment'},
            'block-regex': {
                pattern: /\/{3}[\s\S]*?\/{3}/,
                alias: 'regex',
                inside: {comment: t, interpolation: n}
            }
        }),
        e.languages.insertBefore('coffeescript', 'string', {
            'inline-javascript': {
                pattern: /`(?:\\[\s\S]|[^\\`])*`/,
                inside: {
                    delimiter: {pattern: /^`|`$/, alias: 'punctuation'},
                    rest: e.languages.javascript
                }
            },
            'multiline-string': [
                {pattern: /'''[\s\S]*?'''/, greedy: !0, alias: 'string'},
                {pattern: /"""[\s\S]*?"""/, greedy: !0, alias: 'string', inside: {interpolation: n}}
            ]
        }),
        e.languages.insertBefore('coffeescript', 'keyword', {property: /(?!\d)\w+(?=\s*:(?!:))/}),
        delete e.languages.coffeescript['template-string'],
        (e.languages.coffee = e.languages.coffeescript)
})(Prism)
Prism.languages.diff = {
    coord: [/^(?:\*{3}|-{3}|\+{3}).*$/m, /^@@.*@@$/m, /^\d+.*$/m],
    deleted: /^[-<].*$/m,
    inserted: /^[+>].*$/m,
    diff: {pattern: /^!(?!!).+$/m, alias: 'important'}
}
Prism.languages.git = {
    comment: /^#.*/m,
    deleted: /^[-–].*/m,
    inserted: /^\+.*/m,
    string: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/m,
    command: {pattern: /^.*\$ git .*$/m, inside: {parameter: /\s--?\w+/m}},
    coord: /^@@.*@@$/m,
    commit_sha1: /^commit \w{40}$/m
}
Prism.languages.json = {
    comment: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
    property: {pattern: /"(?:\\.|[^\\"\r\n])*"(?=\s*:)/, greedy: !0},
    string: {pattern: /"(?:\\.|[^\\"\r\n])*"(?!\s*:)/, greedy: !0},
    number: /-?\d+\.?\d*(e[+-]?\d+)?/i,
    punctuation: /[{}[\],]/,
    operator: /:/,
    boolean: /\b(?:true|false)\b/,
    null: {pattern: /\bnull\b/, alias: 'keyword'}
}
;(Prism.languages.markdown = Prism.languages.extend('markup', {})),
    Prism.languages.insertBefore('markdown', 'prolog', {
        blockquote: {pattern: /^>(?:[\t ]*>)*/m, alias: 'punctuation'},
        code: [
            {pattern: /^(?: {4}|\t).+/m, alias: 'keyword'},
            {pattern: /``.+?``|`[^`\n]+`/, alias: 'keyword'},
            {
                pattern: /^```[\s\S]*?^```$/m,
                greedy: !0,
                inside: {
                    'code-block': {
                        pattern: /^(```.*(?:\r?\n|\r))[\s\S]+?(?=(?:\r?\n|\r)^```$)/m,
                        lookbehind: !0
                    },
                    'code-language': {pattern: /^(```).+/, lookbehind: !0},
                    punctuation: /```/
                }
            }
        ],
        title: [
            {
                pattern: /\S.*(?:\r?\n|\r)(?:==+|--+)/,
                alias: 'important',
                inside: {punctuation: /==+$|--+$/}
            },
            {
                pattern: /(^\s*)#+.+/m,
                lookbehind: !0,
                alias: 'important',
                inside: {punctuation: /^#+|#+$/}
            }
        ],
        hr: {
            pattern: /(^\s*)([*-])(?:[\t ]*\2){2,}(?=\s*$)/m,
            lookbehind: !0,
            alias: 'punctuation'
        },
        list: {pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m, lookbehind: !0, alias: 'punctuation'},
        'url-reference': {
            pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
            inside: {
                variable: {pattern: /^(!?\[)[^\]]+/, lookbehind: !0},
                string: /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,
                punctuation: /^[\[\]!:]|[<>]/
            },
            alias: 'url'
        },
        bold: {
            pattern: /(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
            lookbehind: !0,
            greedy: !0,
            inside: {punctuation: /^\*\*|^__|\*\*$|__$/}
        },
        italic: {
            pattern: /(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
            lookbehind: !0,
            greedy: !0,
            inside: {punctuation: /^[*_]|[*_]$/}
        },
        strike: {
            pattern: /(^|[^\\])(~~?)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
            lookbehind: !0,
            greedy: !0,
            inside: {punctuation: /^~~?|~~?$/}
        },
        url: {
            pattern: /!?\[[^\]]+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)| ?\[[^\]\n]*\])/,
            inside: {
                variable: {pattern: /(!?\[)[^\]]+(?=\]$)/, lookbehind: !0},
                string: {pattern: /"(?:\\.|[^"\\])*"(?=\)$)/}
            }
        }
    }),
    (Prism.languages.markdown.bold.inside.url = Prism.languages.markdown.url),
    (Prism.languages.markdown.italic.inside.url = Prism.languages.markdown.url),
    (Prism.languages.markdown.strike.inside.url = Prism.languages.markdown.url),
    (Prism.languages.markdown.bold.inside.italic = Prism.languages.markdown.italic),
    (Prism.languages.markdown.bold.inside.strike = Prism.languages.markdown.strike),
    (Prism.languages.markdown.italic.inside.bold = Prism.languages.markdown.bold),
    (Prism.languages.markdown.italic.inside.strike = Prism.languages.markdown.strike),
    (Prism.languages.markdown.strike.inside.bold = Prism.languages.markdown.bold),
    (Prism.languages.markdown.strike.inside.italic = Prism.languages.markdown.italic),
    Prism.hooks.add('after-tokenize', function(a) {
        function n(a) {
            if (a && 'string' != typeof a)
                for (var e = 0, i = a.length; i > e; e++) {
                    var r = a[e]
                    if ('code' === r.type) {
                        var t = r.content[1],
                            s = r.content[3]
                        if (
                            t &&
                            s &&
                            'code-language' === t.type &&
                            'code-block' === s.type &&
                            'string' == typeof t.content
                        ) {
                            var o =
                                'language-' +
                                t.content
                                    .trim()
                                    .split(/\s+/)[0]
                                    .toLowerCase()
                            s.alias
                                ? 'string' == typeof s.alias
                                    ? (s.alias = [s.alias, o])
                                    : s.alias.push(o)
                                : (s.alias = [o])
                        }
                    } else n(r.content)
                }
        }
        'markdown' === a.language && n(a.tokens)
    }),
    Prism.hooks.add('wrap', function(a) {
        if ('code-block' === a.type) {
            for (var n = '', e = 0, i = a.classes.length; i > e; e++) {
                var r = a.classes[e],
                    t = /language-(\w+)/.exec(r)
                if (t) {
                    n = t[1]
                    break
                }
            }
            var s = Prism.languages[n]
            if (s) {
                var o = a.content.replace(/&lt;/g, '<').replace(/&amp;/g, '&')
                a.content = Prism.highlight(o, s, n)
            }
        }
    }),
    (Prism.languages.md = Prism.languages.markdown)
;(Prism.languages.scss = Prism.languages.extend('css', {
    comment: {pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/, lookbehind: !0},
    atrule: {pattern: /@[\w-]+(?:\([^()]+\)|[^(])*?(?=\s+[{;])/, inside: {rule: /@[\w-]+/}},
    url: /(?:[-a-z]+-)*url(?=\()/i,
    selector: {
        pattern: /(?=\S)[^@;{}()]?(?:[^@;{}()]|#\{\$[-\w]+\})+(?=\s*\{(?:\}|\s|[^}]+[:{][^}]+))/m,
        inside: {
            parent: {pattern: /&/, alias: 'important'},
            placeholder: /%[-\w]+/,
            variable: /\$[-\w]+|#\{\$[-\w]+\}/
        }
    },
    property: {
        pattern: /(?:[\w-]|\$[-\w]+|#\{\$[-\w]+\})+(?=\s*:)/,
        inside: {variable: /\$[-\w]+|#\{\$[-\w]+\}/}
    }
})),
    Prism.languages.insertBefore('scss', 'atrule', {
        keyword: [
            /@(?:if|else(?: if)?|for|each|while|import|extend|debug|warn|mixin|include|function|return|content)/i,
            {pattern: /( +)(?:from|through)(?= )/, lookbehind: !0}
        ]
    }),
    Prism.languages.insertBefore('scss', 'important', {variable: /\$[-\w]+|#\{\$[-\w]+\}/}),
    Prism.languages.insertBefore('scss', 'function', {
        placeholder: {pattern: /%[-\w]+/, alias: 'selector'},
        statement: {pattern: /\B!(?:default|optional)\b/i, alias: 'keyword'},
        boolean: /\b(?:true|false)\b/,
        null: {pattern: /\bnull\b/, alias: 'keyword'},
        operator: {pattern: /(\s)(?:[-+*\/%]|[=!]=|<=?|>=?|and|or|not)(?=\s)/, lookbehind: !0}
    }),
    (Prism.languages.scss.atrule.inside.rest = Prism.languages.scss)
!(function(t) {
    var n = t.util.clone(t.languages.javascript)
    ;(t.languages.jsx = t.languages.extend('markup', n)),
        (t.languages.jsx.tag.pattern = /<\/?(?:[\w.:-]+\s*(?:\s+(?:[\w.:-]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s{'">=]+|\{(?:\{(?:\{[^}]*\}|[^{}])*\}|[^{}])+\}))?|\{\.{3}[a-z_$][\w$]*(?:\.[a-z_$][\w$]*)*\}))*\s*\/?)?>/i),
        (t.languages.jsx.tag.inside.tag.pattern = /^<\/?[^\s>\/]*/i),
        (t.languages.jsx.tag.inside[
            'attr-value'
        ].pattern = /=(?!\{)(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">]+)/i),
        (t.languages.jsx.tag.inside.tag.inside['class-name'] = /^[A-Z]\w*(?:\.[A-Z]\w*)*$/),
        t.languages.insertBefore(
            'inside',
            'attr-name',
            {
                spread: {
                    pattern: /\{\.{3}[a-z_$][\w$]*(?:\.[a-z_$][\w$]*)*\}/,
                    inside: {punctuation: /\.{3}|[{}.]/, 'attr-value': /\w+/}
                }
            },
            t.languages.jsx.tag
        ),
        t.languages.insertBefore(
            'inside',
            'attr-value',
            {
                script: {
                    pattern: /=(\{(?:\{(?:\{[^}]*\}|[^}])*\}|[^}])+\})/i,
                    inside: {
                        'script-punctuation': {pattern: /^=(?={)/, alias: 'punctuation'},
                        rest: t.languages.jsx
                    },
                    alias: 'language-javascript'
                }
            },
            t.languages.jsx.tag
        )
    var e = function(t) {
            return t
                ? 'string' == typeof t
                    ? t
                    : 'string' == typeof t.content
                    ? t.content
                    : t.content.map(e).join('')
                : ''
        },
        a = function(n) {
            for (var s = [], g = 0; g < n.length; g++) {
                var i = n[g],
                    o = !1
                if (
                    ('string' != typeof i &&
                        ('tag' === i.type && i.content[0] && 'tag' === i.content[0].type
                            ? '</' === i.content[0].content[0].content
                                ? s.length > 0 &&
                                  s[s.length - 1].tagName === e(i.content[0].content[1]) &&
                                  s.pop()
                                : '/>' === i.content[i.content.length - 1].content ||
                                  s.push({tagName: e(i.content[0].content[1]), openedBraces: 0})
                            : s.length > 0 && 'punctuation' === i.type && '{' === i.content
                            ? s[s.length - 1].openedBraces++
                            : s.length > 0 &&
                              s[s.length - 1].openedBraces > 0 &&
                              'punctuation' === i.type &&
                              '}' === i.content
                            ? s[s.length - 1].openedBraces--
                            : (o = !0)),
                    (o || 'string' == typeof i) &&
                        s.length > 0 &&
                        0 === s[s.length - 1].openedBraces)
                ) {
                    var p = e(i)
                    g < n.length - 1 &&
                        ('string' == typeof n[g + 1] || 'plain-text' === n[g + 1].type) &&
                        ((p += e(n[g + 1])), n.splice(g + 1, 1)),
                        g > 0 &&
                            ('string' == typeof n[g - 1] || 'plain-text' === n[g - 1].type) &&
                            ((p = e(n[g - 1]) + p), n.splice(g - 1, 1), g--),
                        (n[g] = new t.Token('plain-text', p, null, p))
                }
                i.content && 'string' != typeof i.content && a(i.content)
            }
        }
    t.hooks.add('after-tokenize', function(t) {
        ;('jsx' === t.language || 'tsx' === t.language) && a(t.tokens)
    })
})(Prism)
!(function(e) {
    ;(e.languages.sass = e.languages.extend('css', {
        comment: {pattern: /^([ \t]*)\/[\/*].*(?:(?:\r?\n|\r)\1[ \t]+.+)*/m, lookbehind: !0}
    })),
        e.languages.insertBefore('sass', 'atrule', {
            'atrule-line': {pattern: /^(?:[ \t]*)[@+=].+/m, inside: {atrule: /(?:@[\w-]+|[+=])/m}}
        }),
        delete e.languages.sass.atrule
    var t = /\$[-\w]+|#\{\$[-\w]+\}/,
        a = [/[+*\/%]|[=!]=|<=?|>=?|\b(?:and|or|not)\b/, {pattern: /(\s+)-(?=\s)/, lookbehind: !0}]
    e.languages.insertBefore('sass', 'property', {
        'variable-line': {
            pattern: /^[ \t]*\$.+/m,
            inside: {punctuation: /:/, variable: t, operator: a}
        },
        'property-line': {
            pattern: /^[ \t]*(?:[^:\s]+ *:.*|:[^:\s]+.*)/m,
            inside: {
                property: [/[^:\s]+(?=\s*:)/, {pattern: /(:)[^:\s]+/, lookbehind: !0}],
                punctuation: /:/,
                variable: t,
                operator: a,
                important: e.languages.sass.important
            }
        }
    }),
        delete e.languages.sass.property,
        delete e.languages.sass.important,
        e.languages.insertBefore('sass', 'punctuation', {
            selector: {
                pattern: /([ \t]*)\S(?:,?[^,\r\n]+)*(?:,(?:\r?\n|\r)\1[ \t]+\S(?:,?[^,\r\n]+)*)*/,
                lookbehind: !0
            }
        })
})(Prism)
!(function() {
    function e(e, t) {
        return Array.prototype.slice.call((t || document).querySelectorAll(e))
    }
    function t(e, t) {
        return (
            (t = ' ' + t + ' '), (' ' + e.className + ' ').replace(/[\n\t]/g, ' ').indexOf(t) > -1
        )
    }
    function n(e, n, i) {
        n = 'string' == typeof n ? n : e.getAttribute('data-line')
        for (
            var o,
                l = n.replace(/\s+/g, '').split(','),
                a = +e.getAttribute('data-line-offset') || 0,
                s = r() ? parseInt : parseFloat,
                d = s(getComputedStyle(e).lineHeight),
                u = t(e, 'line-numbers'),
                c = 0;
            (o = l[c++]);

        ) {
            var p = o.split('-'),
                m = +p[0],
                f = +p[1] || m,
                h =
                    e.querySelector('.line-highlight[data-range="' + o + '"]') ||
                    document.createElement('div')
            if (
                (h.setAttribute('aria-hidden', 'true'),
                h.setAttribute('data-range', o),
                (h.className = (i || '') + ' line-highlight'),
                u && Prism.plugins.lineNumbers)
            ) {
                var g = Prism.plugins.lineNumbers.getLine(e, m),
                    y = Prism.plugins.lineNumbers.getLine(e, f)
                g && (h.style.top = g.offsetTop + 'px'),
                    y && (h.style.height = y.offsetTop - g.offsetTop + y.offsetHeight + 'px')
            } else
                h.setAttribute('data-start', m),
                    f > m && h.setAttribute('data-end', f),
                    (h.style.top = (m - a - 1) * d + 'px'),
                    (h.textContent = new Array(f - m + 2).join(' \n'))
            u ? e.appendChild(h) : (e.querySelector('code') || e).appendChild(h)
        }
    }
    function i() {
        var t = location.hash.slice(1)
        e('.temporary.line-highlight').forEach(function(e) {
            e.parentNode.removeChild(e)
        })
        var i = (t.match(/\.([\d,-]+)$/) || [, ''])[1]
        if (i && !document.getElementById(t)) {
            var r = t.slice(0, t.lastIndexOf('.')),
                o = document.getElementById(r)
            o &&
                (o.hasAttribute('data-line') || o.setAttribute('data-line', ''),
                n(o, i, 'temporary '),
                document.querySelector('.temporary.line-highlight').scrollIntoView())
        }
    }
    if ('undefined' != typeof self && self.Prism && self.document && document.querySelector) {
        var r = (function() {
                var e
                return function() {
                    if ('undefined' == typeof e) {
                        var t = document.createElement('div')
                        ;(t.style.fontSize = '13px'),
                            (t.style.lineHeight = '1.5'),
                            (t.style.padding = 0),
                            (t.style.border = 0),
                            (t.innerHTML = '&nbsp;<br />&nbsp;'),
                            document.body.appendChild(t),
                            (e = 38 === t.offsetHeight),
                            document.body.removeChild(t)
                    }
                    return e
                }
            })(),
            o = 0
        Prism.hooks.add('before-sanity-check', function(t) {
            var n = t.element.parentNode,
                i = n && n.getAttribute('data-line')
            if (n && i && /pre/i.test(n.nodeName)) {
                var r = 0
                e('.line-highlight', n).forEach(function(e) {
                    ;(r += e.textContent.length), e.parentNode.removeChild(e)
                }),
                    r && /^( \n)+$/.test(t.code.slice(-r)) && (t.code = t.code.slice(0, -r))
            }
        }),
            Prism.hooks.add('complete', function l(e) {
                var r = e.element.parentNode,
                    a = r && r.getAttribute('data-line')
                if (r && a && /pre/i.test(r.nodeName)) {
                    clearTimeout(o)
                    var s = Prism.plugins.lineNumbers,
                        d = e.plugins && e.plugins.lineNumbers
                    t(r, 'line-numbers') && s && !d
                        ? Prism.hooks.add('line-numbers', l)
                        : (n(r, a), (o = setTimeout(i, 1)))
                }
            }),
            window.addEventListener('hashchange', i),
            window.addEventListener('resize', function() {
                var e = document.querySelectorAll('pre[data-line]')
                Array.prototype.forEach.call(e, function(e) {
                    n(e)
                })
            })
    }
})()
!(function() {
    if ('undefined' != typeof self && self.Prism && self.document) {
        var e = 'line-numbers',
            t = /\n(?!$)/g,
            n = function(e) {
                var n = r(e),
                    s = n['white-space']
                if ('pre-wrap' === s || 'pre-line' === s) {
                    var l = e.querySelector('code'),
                        i = e.querySelector('.line-numbers-rows'),
                        a = e.querySelector('.line-numbers-sizer'),
                        o = l.textContent.split(t)
                    a ||
                        ((a = document.createElement('span')),
                        (a.className = 'line-numbers-sizer'),
                        l.appendChild(a)),
                        (a.style.display = 'block'),
                        o.forEach(function(e, t) {
                            a.textContent = e || '\n'
                            var n = a.getBoundingClientRect().height
                            i.children[t].style.height = n + 'px'
                        }),
                        (a.textContent = ''),
                        (a.style.display = 'none')
                }
            },
            r = function(e) {
                return e
                    ? window.getComputedStyle
                        ? getComputedStyle(e)
                        : e.currentStyle || null
                    : null
            }
        window.addEventListener('resize', function() {
            Array.prototype.forEach.call(document.querySelectorAll('pre.' + e), n)
        }),
            Prism.hooks.add('complete', function(e) {
                if (e.code) {
                    var r = e.element.parentNode,
                        s = /\s*\bline-numbers\b\s*/
                    if (
                        r &&
                        /pre/i.test(r.nodeName) &&
                        (s.test(r.className) || s.test(e.element.className)) &&
                        !e.element.querySelector('.line-numbers-rows')
                    ) {
                        s.test(e.element.className) &&
                            (e.element.className = e.element.className.replace(s, ' ')),
                            s.test(r.className) || (r.className += ' line-numbers')
                        var l,
                            i = e.code.match(t),
                            a = i ? i.length + 1 : 1,
                            o = new Array(a + 1)
                        ;(o = o.join('<span></span>')),
                            (l = document.createElement('span')),
                            l.setAttribute('aria-hidden', 'true'),
                            (l.className = 'line-numbers-rows'),
                            (l.innerHTML = o),
                            r.hasAttribute('data-start') &&
                                (r.style.counterReset =
                                    'linenumber ' +
                                    (parseInt(r.getAttribute('data-start'), 10) - 1)),
                            e.element.appendChild(l),
                            n(r),
                            Prism.hooks.run('line-numbers', e)
                    }
                }
            }),
            Prism.hooks.add('line-numbers', function(e) {
                ;(e.plugins = e.plugins || {}), (e.plugins.lineNumbers = !0)
            }),
            (Prism.plugins.lineNumbers = {
                getLine: function(t, n) {
                    if ('PRE' === t.tagName && t.classList.contains(e)) {
                        var r = t.querySelector('.line-numbers-rows'),
                            s = parseInt(t.getAttribute('data-start'), 10) || 1,
                            l = s + (r.children.length - 1)
                        s > n && (n = s), n > l && (n = l)
                        var i = n - s
                        return r.children[i]
                    }
                }
            })
    }
})()
!(function() {
    'undefined' != typeof self &&
        self.Prism &&
        self.document &&
        document.querySelector &&
        ((self.Prism.fileHighlight = function(t) {
            t = t || document
            var e = {
                js: 'javascript',
                py: 'python',
                rb: 'ruby',
                ps1: 'powershell',
                psm1: 'powershell',
                sh: 'bash',
                bat: 'batch',
                h: 'c',
                tex: 'latex'
            }
            Array.prototype.slice.call(t.querySelectorAll('pre[data-src]')).forEach(function(t) {
                if (!t.hasAttribute('data-src-loaded')) {
                    for (
                        var a,
                            n = t.getAttribute('data-src'),
                            r = t,
                            s = /\blang(?:uage)?-([\w-]+)\b/i;
                        r && !s.test(r.className);

                    )
                        r = r.parentNode
                    if ((r && (a = (t.className.match(s) || [, ''])[1]), !a)) {
                        var o = (n.match(/\.(\w+)$/) || [, ''])[1]
                        a = e[o] || o
                    }
                    var l = document.createElement('code')
                    ;(l.className = 'language-' + a),
                        (t.textContent = ''),
                        (l.textContent = 'Loading…'),
                        t.appendChild(l)
                    var i = new XMLHttpRequest()
                    i.open('GET', n, !0),
                        (i.onreadystatechange = function() {
                            4 == i.readyState &&
                                (i.status < 400 && i.responseText
                                    ? ((l.textContent = i.responseText),
                                      Prism.highlightElement(l),
                                      t.setAttribute('data-src-loaded', ''))
                                    : (l.textContent =
                                          i.status >= 400
                                              ? '✖ Error ' +
                                                i.status +
                                                ' while fetching file: ' +
                                                i.statusText
                                              : '✖ Error: File does not exist or is empty'))
                        }),
                        i.send(null)
                }
            }),
                Prism.plugins.toolbar &&
                    Prism.plugins.toolbar.registerButton('download-file', function(t) {
                        var e = t.element.parentNode
                        if (
                            e &&
                            /pre/i.test(e.nodeName) &&
                            e.hasAttribute('data-src') &&
                            e.hasAttribute('data-download-link')
                        ) {
                            var a = e.getAttribute('data-src'),
                                n = document.createElement('a')
                            return (
                                (n.textContent =
                                    e.getAttribute('data-download-link-label') || 'Download'),
                                n.setAttribute('download', ''),
                                (n.href = a),
                                n
                            )
                        }
                    })
        }),
        document.addEventListener('DOMContentLoaded', function() {
            self.Prism.fileHighlight()
        }))
})()
!(function() {
    if ('undefined' != typeof self && self.Prism && self.document) {
        var t = [],
            e = {},
            n = function() {}
        Prism.plugins.toolbar = {}
        var a = (Prism.plugins.toolbar.registerButton = function(n, a) {
                var o
                ;(o =
                    'function' == typeof a
                        ? a
                        : function(t) {
                              var e
                              return (
                                  'function' == typeof a.onClick
                                      ? ((e = document.createElement('button')),
                                        (e.type = 'button'),
                                        e.addEventListener('click', function() {
                                            a.onClick.call(this, t)
                                        }))
                                      : 'string' == typeof a.url
                                      ? ((e = document.createElement('a')), (e.href = a.url))
                                      : (e = document.createElement('span')),
                                  (e.textContent = a.text),
                                  e
                              )
                          }),
                    t.push((e[n] = o))
            }),
            o = (Prism.plugins.toolbar.hook = function(a) {
                var o = a.element.parentNode
                if (
                    o &&
                    /pre/i.test(o.nodeName) &&
                    !o.parentNode.classList.contains('code-toolbar')
                ) {
                    var r = document.createElement('div')
                    r.classList.add('code-toolbar'),
                        o.parentNode.insertBefore(r, o),
                        r.appendChild(o)
                    var i = document.createElement('div')
                    i.classList.add('toolbar'),
                        document.body.hasAttribute('data-toolbar-order') &&
                            (t = document.body
                                .getAttribute('data-toolbar-order')
                                .split(',')
                                .map(function(t) {
                                    return e[t] || n
                                })),
                        t.forEach(function(t) {
                            var e = t(a)
                            if (e) {
                                var n = document.createElement('div')
                                n.classList.add('toolbar-item'), n.appendChild(e), i.appendChild(n)
                            }
                        }),
                        r.appendChild(i)
                }
            })
        a('label', function(t) {
            var e = t.element.parentNode
            if (e && /pre/i.test(e.nodeName) && e.hasAttribute('data-label')) {
                var n,
                    a,
                    o = e.getAttribute('data-label')
                try {
                    a = document.querySelector('template#' + o)
                } catch (r) {}
                return (
                    a
                        ? (n = a.content)
                        : (e.hasAttribute('data-url')
                              ? ((n = document.createElement('a')),
                                (n.href = e.getAttribute('data-url')))
                              : (n = document.createElement('span')),
                          (n.textContent = o)),
                    n
                )
            }
        }),
            Prism.hooks.add('complete', o)
    }
})()
!(function() {
    ;('undefined' != typeof self && !self.Prism) ||
        ('undefined' != typeof global && !global.Prism) ||
        Prism.hooks.add('wrap', function(e) {
            'keyword' === e.type && e.classes.push('keyword-' + e.content)
        })
})()
!(function() {
    if ('undefined' != typeof self && self.Prism && self.document) {
        var e = /(?:^|\s)command-line(?:\s|$)/
        Prism.hooks.add('before-highlight', function(t) {
            var a = (t.vars = t.vars || {}),
                n = (a['command-line'] = a['command-line'] || {})
            if (n.complete || !t.code) return (n.complete = !0), void 0
            var r = t.element.parentNode
            if (
                !r ||
                !/pre/i.test(r.nodeName) ||
                (!e.test(r.className) && !e.test(t.element.className))
            )
                return (n.complete = !0), void 0
            if (t.element.querySelector('.command-line-prompt')) return (n.complete = !0), void 0
            var o = t.code.split('\n')
            n.numberOfLines = o.length
            var s = (n.outputLines = []),
                i = r.getAttribute('data-output'),
                l = r.getAttribute('data-filter-output')
            if (i || '' === i) {
                i = i.split(',')
                for (var m = 0; m < i.length; m++) {
                    var d = i[m].split('-'),
                        p = parseInt(d[0], 10),
                        c = 2 === d.length ? parseInt(d[1], 10) : p
                    if (!isNaN(p) && !isNaN(c)) {
                        1 > p && (p = 1), c > o.length && (c = o.length), p--, c--
                        for (var u = p; c >= u; u++) (s[u] = o[u]), (o[u] = '')
                    }
                }
            } else if (l) for (var m = 0; m < o.length; m++) 0 === o[m].indexOf(l) && ((s[m] = o[m].slice(l.length)), (o[m] = ''))
            t.code = o.join('\n')
        }),
            Prism.hooks.add('before-insert', function(e) {
                var t = (e.vars = e.vars || {}),
                    a = (t['command-line'] = t['command-line'] || {})
                if (!a.complete) {
                    for (
                        var n = e.highlightedCode.split('\n'), r = 0;
                        r < a.outputLines.length;
                        r++
                    )
                        a.outputLines.hasOwnProperty(r) && (n[r] = a.outputLines[r])
                    e.highlightedCode = n.join('\n')
                }
            }),
            Prism.hooks.add('complete', function(t) {
                var a = (t.vars = t.vars || {}),
                    n = (a['command-line'] = a['command-line'] || {})
                if (!n.complete) {
                    var r = t.element.parentNode
                    e.test(t.element.className) &&
                        (t.element.className = t.element.className.replace(e, ' ')),
                        e.test(r.className) || (r.className += ' command-line')
                    var o = function(e, t) {
                            return (r.getAttribute(e) || t).replace(/"/g, '&quot')
                        },
                        s = new Array(n.numberOfLines + 1),
                        i = o('data-prompt', '')
                    if ('' !== i) s = s.join('<span data-prompt="' + i + '"></span>')
                    else {
                        var l = o('data-user', 'user'),
                            m = o('data-host', 'localhost')
                        s = s.join('<span data-user="' + l + '" data-host="' + m + '"></span>')
                    }
                    var d = document.createElement('span')
                    ;(d.className = 'command-line-prompt'), (d.innerHTML = s)
                    for (var p = 0; p < n.outputLines.length; p++)
                        if (n.outputLines.hasOwnProperty(p)) {
                            var c = d.children[p]
                            c.removeAttribute('data-user'),
                                c.removeAttribute('data-host'),
                                c.removeAttribute('data-prompt')
                        }
                    t.element.insertBefore(d, t.element.firstChild), (n.complete = !0)
                }
            })
    }
})()
!(function() {
    function e(e) {
        this.defaults = r({}, e)
    }
    function n(e) {
        return e.replace(/-(\w)/g, function(e, n) {
            return n.toUpperCase()
        })
    }
    function t(e) {
        for (var n = 0, t = 0; t < e.length; ++t) e.charCodeAt(t) == '	'.charCodeAt(0) && (n += 3)
        return e.length + n
    }
    var r =
        Object.assign ||
        function(e, n) {
            for (var t in n) n.hasOwnProperty(t) && (e[t] = n[t])
            return e
        }
    ;(e.prototype = {
        setDefaults: function(e) {
            this.defaults = r(this.defaults, e)
        },
        normalize: function(e, t) {
            t = r(this.defaults, t)
            for (var i in t) {
                var o = n(i)
                'normalize' !== i &&
                    'setDefaults' !== o &&
                    t[i] &&
                    this[o] &&
                    (e = this[o].call(this, e, t[i]))
            }
            return e
        },
        leftTrim: function(e) {
            return e.replace(/^\s+/, '')
        },
        rightTrim: function(e) {
            return e.replace(/\s+$/, '')
        },
        tabsToSpaces: function(e, n) {
            return (n = 0 | n || 4), e.replace(/\t/g, new Array(++n).join(' '))
        },
        spacesToTabs: function(e, n) {
            return (n = 0 | n || 4), e.replace(RegExp(' {' + n + '}', 'g'), '	')
        },
        removeTrailing: function(e) {
            return e.replace(/\s*?$/gm, '')
        },
        removeInitialLineFeed: function(e) {
            return e.replace(/^(?:\r?\n|\r)/, '')
        },
        removeIndent: function(e) {
            var n = e.match(/^[^\S\n\r]*(?=\S)/gm)
            return n && n[0].length
                ? (n.sort(function(e, n) {
                      return e.length - n.length
                  }),
                  n[0].length ? e.replace(RegExp('^' + n[0], 'gm'), '') : e)
                : e
        },
        indent: function(e, n) {
            return e.replace(/^[^\S\n\r]*(?=\S)/gm, new Array(++n).join('	') + '$&')
        },
        breakLines: function(e, n) {
            n = n === !0 ? 80 : 0 | n || 80
            for (var r = e.split('\n'), i = 0; i < r.length; ++i)
                if (!(t(r[i]) <= n)) {
                    for (var o = r[i].split(/(\s+)/g), a = 0, s = 0; s < o.length; ++s) {
                        var l = t(o[s])
                        ;(a += l), a > n && ((o[s] = '\n' + o[s]), (a = l))
                    }
                    r[i] = o.join('')
                }
            return r.join('\n')
        }
    }),
        'undefined' != typeof module && module.exports && (module.exports = e),
        'undefined' != typeof Prism &&
            ((Prism.plugins.NormalizeWhitespace = new e({
                'remove-trailing': !0,
                'remove-indent': !0,
                'left-trim': !0,
                'right-trim': !0
            })),
            Prism.hooks.add('before-sanity-check', function(e) {
                var n = Prism.plugins.NormalizeWhitespace
                if (!e.settings || e.settings['whitespace-normalization'] !== !1) {
                    if ((!e.element || !e.element.parentNode) && e.code)
                        return (e.code = n.normalize(e.code, e.settings)), void 0
                    var t = e.element.parentNode,
                        r = /\bno-whitespace-normalization\b/
                    if (
                        e.code &&
                        t &&
                        'pre' === t.nodeName.toLowerCase() &&
                        !r.test(t.className) &&
                        !r.test(e.element.className)
                    ) {
                        for (
                            var i = t.childNodes, o = '', a = '', s = !1, l = 0;
                            l < i.length;
                            ++l
                        ) {
                            var c = i[l]
                            c == e.element
                                ? (s = !0)
                                : '#text' === c.nodeName &&
                                  (s ? (a += c.nodeValue) : (o += c.nodeValue),
                                  t.removeChild(c),
                                  --l)
                        }
                        if (e.element.children.length && Prism.plugins.KeepMarkup) {
                            var u = o + e.element.innerHTML + a
                            ;(e.element.innerHTML = n.normalize(u, e.settings)),
                                (e.code = e.element.textContent)
                        } else (e.code = o + e.code + a), (e.code = n.normalize(e.code, e.settings))
                    }
                }
            }))
})()
!(function() {
    if ('undefined' != typeof self && self.Prism && self.document) {
        if (!Prism.plugins.toolbar)
            return console.warn('Copy to Clipboard plugin loaded before Toolbar plugin.'), void 0
        var o = window.ClipboardJS || void 0
        o || 'function' != typeof require || (o = require('clipboard'))
        var e = []
        if (!o) {
            var t = document.createElement('script'),
                n = document.querySelector('head')
            ;(t.onload = function() {
                if ((o = window.ClipboardJS)) for (; e.length; ) e.pop()()
            }),
                (t.src =
                    'https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js'),
                n.appendChild(t)
        }
        Prism.plugins.toolbar.registerButton('copy-to-clipboard', function(t) {
            function n() {
                var e = new o(i, {
                    text: function() {
                        return t.code
                    }
                })
                e.on('success', function() {
                    ;(i.textContent = 'Copied!'), r()
                }),
                    e.on('error', function() {
                        ;(i.textContent = 'Press Ctrl+C to copy'), r()
                    })
            }
            function r() {
                setTimeout(function() {
                    i.textContent = 'Copy'
                }, 5e3)
            }
            var i = document.createElement('a')
            return (i.textContent = 'Copy'), o ? n() : e.push(n), i
        })
    }
})()
