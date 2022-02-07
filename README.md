# api-extractor-remap

Remap [api-extractor](https://api-extractor.com/) markdown.

## Usage

```
- uses: bengreenier-actions/api-extractor-remap@v1.0.0
  with:
    # The name of the library api-extractor was run against
    libName: "your-lib"
    # A new link value to use for the index
    indexLink: "./relative-link"
    # A new link value to use for home
    homeLink: "https://example.com/direct-link"
    # Paths to run against. Globs supported
    path: "*.md"
```
