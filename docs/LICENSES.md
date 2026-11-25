# Licenses

The static application is implemented with web platform APIs. Backend code uses Node.js built-ins plus the packages below. npm package versions are pinned in `package-lock.json`.

| Package | License | Use |
|---|---|---|
| `@asamuzakjp/css-color` | MIT | jsdom CSS support |
| `@asamuzakjp/dom-selector` | MIT | jsdom DOM selector support |
| `@bramus/specificity` | MIT | jsdom CSS selector support |
| `@csstools/color-helpers` | MIT-0 | CSS color support |
| `@csstools/css-calc` | MIT | CSS calculation support |
| `@csstools/css-color-parser` | MIT | CSS color parsing |
| `@csstools/css-parser-algorithms` | MIT | CSS parsing |
| `@csstools/css-syntax-patches-for-csstree` | MIT-0 | CSS parser compatibility |
| `@csstools/css-tokenizer` | MIT | CSS tokenization |
| `@exodus/bytes` | MIT | byte utilities |
| `@mozilla/readability` | Apache-2.0 | article extraction |
| `pdfjs-dist` | Apache-2.0 | browser-side PDF parsing |
| `@playwright/test` | Apache-2.0 | browser tests |
| `axe-core` | MPL-2.0 | accessibility audits |
| `bidi-js` | MIT | bidirectional text support |
| `css-tree` | MIT | CSS parsing |
| `data-urls` | MIT | jsdom URL parsing |
| `decimal.js` | MIT | numeric CSS calculations |
| `entities` | BSD-2-Clause | HTML entities |
| `html-encoding-sniffer` | MIT | HTML encoding detection |
| `is-potential-custom-element-name` | MIT | DOM validation |
| `jsdom` | MIT | server-side DOM parsing |
| `lru-cache` | BlueOak-1.0.0 | cache utilities |
| `mdn-data` | CC0-1.0 | web platform metadata |
| `parse5` | MIT | HTML parsing |
| `playwright` | Apache-2.0 | browser automation |
| `playwright-core` | Apache-2.0 | browser protocol |
| `punycode` | MIT | domain normalization |
| `require-from-string` | MIT | module utility |
| `saxes` | ISC | XML parsing |
| `source-map-js` | BSD-3-Clause | source map support |
| `tldts` | MIT | top-level domain parsing |
| `tldts-core` | MIT | top-level domain data |
| `tough-cookie` | BSD-3-Clause | cookie handling in jsdom |
| `tr46` | MIT | IDNA processing |
| `undici` | MIT | fetch implementation |
| `w3c-xmlserializer` | MIT | XML serialization |
| `webidl-conversions` | BSD-2-Clause | Web IDL conversions |
| `whatwg-mimetype` | MIT | MIME parsing |
| `whatwg-url` | MIT | URL parsing |
| `xml-name-validator` | Apache-2.0 | XML name validation |
| `xmlchars` | MIT | XML character definitions |

Playwright browser binaries are test-only and are not shipped to users; consult their distribution notices when installing them in CI. Imported web content and story illustrations must have independent reuse rights. No third-party story text or artwork is bundled in the URL fixtures.
