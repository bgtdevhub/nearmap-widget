# Nearmap Widget for ArcGIS Experience Builder

## How to use

1. Download the files in this folder
2. Place the _nearmap-integration_ folder inside the folder inside your custom widgets folder of your client's side of ArcGIS Experience Builder
3. Install dependencies by running the following command inside the created widget folder

```
npm install
```

3. Start your client
4. Create a new experience and load the following widgets as a start
   - Map
   - Nearmap Integration
   - Search Widget (recommended)
     - Refer [here](https://developers.arcgis.com/experience-builder/guide/search-widget/) for guide
5. Go to Nearmap Integration settings and perform the following actions
   - Select map
   - Enter Nearmap API Key
6. Save the map and preview

## Recommended usage

### General

- Attached to a map widget
- Use search widget instead of built-in search in map widget for better flexibility

### Style

- Width : auto
- Height : auto
- Snap to bottom
- Horizontal Center
