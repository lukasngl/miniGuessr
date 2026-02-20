# miniGuessr

A lightweight GeoGuessr-style game built with SvelteKit. Explore random Google Street View locations and guess where you are on a map.

**Play it:** https://lukasngl.github.io/miniGuessr/

## Features

- Random Street View locations worldwide or filtered by country
- Urban mode: bias toward populated areas
- City mode: explore a specific city within a radius
- Interactive Leaflet map for placing guesses
- Distance scoring with result overlay

## Setup

Requires a [Google Maps API key](https://developers.google.com/maps/documentation/embed/get-api-key) with the Maps Embed API enabled.

```sh
# install dependencies
bun install

# set your API key
export PUBLIC_GOOGLE_MAPS_API_KEY="your-key-here"

# start dev server
bun run dev
```

## Deployment

The app deploys to GitHub Pages via the included workflow. Add `PUBLIC_GOOGLE_MAPS_API_KEY` as a repository secret.

## License

[CC0 1.0](LICENSE) - Public Domain
