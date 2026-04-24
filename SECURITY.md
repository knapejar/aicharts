# Security policy

## Reporting a vulnerability

Email security@aicharts.dev with details and a reproduction. We aim to acknowledge within 72 hours.

Please do not open public GitHub issues for security problems.

## Scope

aicharts renders declarative chart configs to SVG then rasterizes to PNG. The library does not execute user-supplied code. Fonts and basemaps are bundled at build time from known sources.

The MCP server accepts configs over stdio or HTTP and returns images. No shell invocation, no filesystem writes outside of designated cache directories.

## Supported versions

The latest minor version on the `main` branch receives security fixes. Older versions may receive backports at the maintainers' discretion.
