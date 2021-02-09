import * as THREE from "three";

export const createTextureAtlas = (function () {
  const ATLAS_SIZE_PX = 2048;
  const ATLAS_SQRT = 4;
  const IMAGE_SIZE = ATLAS_SIZE_PX / ATLAS_SQRT;

  const DEFAULT_COLOR = new Map([
    ["map", "#ffffff"],
    ["aoMap", "#ffffff"],
    // ["normalMap", "#000000"], //TODO: Check normalMap type. ObjectSpaceNormalMap or TangentSpaceNormalMap
    ["roughnessMap", "#ffffff"],
    ["metalnessMap", "#ffffff"],
    ["emissiveMap", "#ffffff"],
    // "lightMap",
    // "bumpMap",
    // "displacementMap",
    // "alphaMap",
    // "envMap",
  ]);
  const MAP_NAMES = Array.from(DEFAULT_COLOR.keys());

  const WHITE = new THREE.Color(1, 1, 1);

  return async function createTextureAtlas({ meshes }) {
    const ctx = Object.fromEntries(
      MAP_NAMES.map((name) => {
        const canvas = document.createElement("canvas");
        canvas.width = ATLAS_SIZE_PX;
        canvas.height = ATLAS_SIZE_PX;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add canvases to document for debugging
        document.body.append(name);
        document.body.append(canvas);
        return [name, ctx];
      })
    );

    const uvs = new Map(
      meshes.map((mesh, i) => {
        const min = new THREE.Vector2(i % ATLAS_SQRT, Math.floor(i / ATLAS_SQRT)).multiplyScalar(1 / ATLAS_SQRT);
        const max = new THREE.Vector2(min.x + 1 / ATLAS_SQRT, min.y + 1 / ATLAS_SQRT);

        MAP_NAMES.forEach((name) => {
          const image = mesh.material && mesh.material[name] && mesh.material[name].image;

          if (image && name === "map") {
            ctx[name].globalCompositeOperation = "source-over";
            ctx[name].drawImage(image, min.x * ATLAS_SIZE_PX, min.y * ATLAS_SIZE_PX, IMAGE_SIZE, IMAGE_SIZE);
            // if (!mesh.material.color.equals(WHITE)) {
            console.log("multiplying color");
            // Bake color into map
            ctx[name].globalCompositeOperation = "multiply";
            ctx[name].fillStyle = "#" + mesh.material.color.getHexString();
            console.log(mesh.material.color.getHexString(), mesh.material.name);
            ctx[name].fillRect(min.x * ATLAS_SIZE_PX, min.y * ATLAS_SIZE_PX, IMAGE_SIZE, IMAGE_SIZE);
            // }
          } else if (image && name !== "map") {
            ctx[name].globalCompositeOperation = "source-over";
            ctx[name].drawImage(image, min.x * ATLAS_SIZE_PX, min.y * ATLAS_SIZE_PX, IMAGE_SIZE, IMAGE_SIZE);
          } else if (!image && name === "map") {
            ctx[name].globalCompositeOperation = "source-over";
            //ctx[name].fillStyle = "#" + WHITE.getHexString();
            ctx[name].fillStyle = "#" + mesh.material.color.getHexString();
            ctx[name].fillRect(min.x * ATLAS_SIZE_PX, min.y * ATLAS_SIZE_PX, IMAGE_SIZE, IMAGE_SIZE);
          } else if (!image && name != "map") {
            ctx[name].globalCompositeOperation = "source-over";
            ctx[name].fillStyle = DEFAULT_COLOR.get(name);
            ctx[name].fillRect(min.x * ATLAS_SIZE_PX, min.y * ATLAS_SIZE_PX, IMAGE_SIZE, IMAGE_SIZE);
          } else {
            console.error("Ruh roh", mesh.material);
          }
        });

        return [mesh, { min, max }];
      })
    );

    const images = new Map(
      await Promise.all(
        MAP_NAMES.map(async (name) => {
          const url = await new Promise((resolve) => {
            ctx[name].canvas.toBlob((blob) => {
              resolve(URL.createObjectURL(blob));
            });
          });

          const img = document.createElement("img");
          await new Promise((resolve) => {
            img.onload = resolve;
            img.src = url;
          });
          return [name, img];
        })
      )
    );

    return { images, uvs };
  };
})();
