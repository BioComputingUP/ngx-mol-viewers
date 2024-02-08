# ngx-bio-tools

## Publish on GitHub pages

```console
# Build the package in production mode, with correct base URL
ng build -c=production --base-href https://damiclem.github.io/ngx-bio-tools/ demo-showcase
# Copy index.html to 404.htl [REQUIRED]
cp docs/index.html docs/404.html
```