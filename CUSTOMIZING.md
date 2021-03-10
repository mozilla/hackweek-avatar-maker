# Customization Guide

We invite the community to use this editor as a template for creating and hosting new avatar tools. The code is released under the MPL 2.0 and we'd love to see what you make with it!

If you want to create a custom accessory or part, see [Adding a Custom Model](#adding-a-custom-model).
If you want to use this project as a template for your own avatar maker, see [Creating your own Avatar Creator](#creating-your-own-avatar-maker).

## Adding a Custom Model

To add a custom avatar part to use in the editor:

- create your 3D model in [Blender](https://www.blender.org/),
- export it as a glb file with the [Blender glTF 2.0 Exporter](https://github.com/KhronosGroup/glTF-Blender-IO#introduction),
- name the file according to the editor's naming convention (see [Asset Names](#asset-names)),
- use the `Upload Custom Part` button to add your model to the avatar.

Each part of the avatar is designed to work with same skeleton. In order for your custom model to work correctly in the editor, you will need to bind your mesh to this skeleton. https://github.com/mozilla/hackweek-avatar-maker/raw/main/assets/blender/avatar-casual_share.zip

For more information on creating avatars for Hubs, you can consult the existing hubs docs for [creating custom avatars](https://hubs.mozilla.com/docs/creators-advanced-avatar-customization.html#modify-base-robot-template).

## Creating your own avatar maker

To create your own avatar maker,

- [run this project locally](#run-locally),
- customize the code however you want (see [High Level Code Overview](#high-level-code-overview)),
- replace the assets with your own (see [Asset Names](#asset-names)), and
- generate new [thumbnails](#thumbnails) and [metadata](#asset-metadata).

## Run locally

- Clone this repo with [git](https://git-scm.com/doc) or fork it on [github](https://github.com/).
- Install [`node js`](https://nodejs.org/en/).
- Install dependencies `npm ci`.
- Run the app `npm run start`.

## Asset Names

The name of an asset determines its `category` and `displayName` within the app. The naming convention is `category-name_item-name.glb`. For example, the file:

```
  accessory_duck-floaty.glb
```

adds an entry called `Duck Floaty` to the `Accessory` category.

## Asset Metadata

The editor relies on a file called `assets.js` to describe all of the available avatar parts and any metadata about them. This file can be regenerated for new assets by running `npm run gen-assets`. You may need to edit the associated script (and the `fix-assets` script) depending on how you want to surface your parts in the front end.

Each `category` has a collection of `part`s and (optionally) a `description` that tells the front end code how to present options to the user. Each `part` has a `value` indicating an associated`glb` and thumbnail, a `displayName`, and (optionally) a `description` with metadata.

## Thumbnails

After adding new assets, you can automatically generate thumbnails for them:

- `cd scripts/generate-thumbnails`
- `npm ci`
- `npm run gen-thumbnails`

## High Level Code Overview

You will need to dig into the code to understand how to change it to make it do what you want it to, but here is a high-level "map" to get you started:

| File                       | Description                                                                                                                                                                                                                                          |
| :------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.js`                 | App entry point. This runs when you start the app. It starts the 3D "game loop" and the 2D react render loop.                                                                                                                                        |
| `AvatarEditorContainer.js` | Root of the react "half" of the app. Communicates to the "game loop" half by dispatching events (e.g. the `avatarConfigChanged` event which tells the "game" half to change the avatar parts in the preview.)                                        |
| `game.js`                  | Root of the game "half" of the app. The `tick` function runs in a loop via the browser's `requestAnimationFrame`. A THREE.js scene is constructed with the various avatar parts loaded from GLB files, and the scene is then rendered to the canvas. |
| `export.js`                | The place where your avatar parts will be combined and exported. Look for debug flags in the `combine` step (or skip mesh combination entirely) if you notice any issues with your exported avatar.                                                  |
