# Nearmap Widget for ArcGIS Enterprise

## How to setup widget

Follow the steps from [here](https://www.esri.com/arcgis-blog/products/arcgis-enterprise/developers/add-experience-builder-custom-widgets-in-arcgis-enterprise/) starting from step 2.

### Github Manifest URL

https://bgtdevhub.github.io/nearmap-widget/enterprise/nearmap-integration/manifest.json

## How to use

1. Start your client
2. Create a new experience and load the following widgets as a start
   - Map
   - Nearmap Integration
   - Search Widget (recommended)
     - Refer [here](https://developers.arcgis.com/experience-builder/guide/search-widget/) for guide
3. Go to Nearmap Integration settings and perform the following actions
   - Select map
   - Enter Nearmap API Key
4. Save the map and preview

## Recommended usage

### General

- Attached to a map widget
- Use search widget instead of built-in search in map widget for better flexibility

### Style

- Width : auto
- Height : auto
- Snap to bottom
- Horizontal Center
