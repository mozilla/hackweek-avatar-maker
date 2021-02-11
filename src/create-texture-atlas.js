import * as THREE from "three";

function createContext({ width, height }) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);

  return context;
}

function getTextureImage(material, textureName) {
  return material[textureName] && material[textureName].image;
}

async function canvasToImage(canvas) {
  const url = await new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(URL.createObjectURL(blob));
    });
  });

  const image = document.createElement("img");
  await new Promise((resolve) => {
    image.onload = resolve;
    image.src = url;
  });

  return image;
}

export const createTextureAtlas = (function () {
  const ATLAS_SIZE_PX = 2048;
  const ATLAS_SQRT = 4;
  const IMAGE_SIZE = ATLAS_SIZE_PX / ATLAS_SQRT;
  const IMAGE_NAMES = ["diffuse", "normal", "orm"];

  return async function createTextureAtlas({ meshes }) {
    const contexts = Object.fromEntries(
      IMAGE_NAMES.map((name) => [name, createContext({ width: ATLAS_SIZE_PX, height: ATLAS_SIZE_PX })])
    );

    const debugCanvases = true;
    if (debugCanvases) {
      const previous = document.getElementById("debug-canvases");
      if (previous) {
        previous.parentNode.removeChild(previous);
      }

      const domElement = document.createElement("div");
      domElement.setAttribute("id", "debug-canvases");
      document.body.append(domElement);

      IMAGE_NAMES.map((name) => {
        const title = document.createElement("h1");
        title.innerText = name;
        domElement.append(title);
        domElement.append(contexts[name].canvas);
      });
    }

    const uvs = new Map(
      meshes.map((mesh, i) => {
        const min = new THREE.Vector2(i % ATLAS_SQRT, Math.floor(i / ATLAS_SQRT)).multiplyScalar(1 / ATLAS_SQRT);
        const max = new THREE.Vector2(min.x + 1 / ATLAS_SQRT, min.y + 1 / ATLAS_SQRT);
        return [mesh, { min, max }];
      })
    );

    // Draw image for diffuse map
    {
      const context = contexts["diffuse"];
      meshes.forEach((mesh) => {
        const image = getTextureImage(mesh.material, "map");
        const { min, max } = uvs.get(mesh);
        if (image) {
          context.globalCompositeOperation = "source-over";
          context.drawImage(image, min.x * ATLAS_SIZE_PX, min.y * ATLAS_SIZE_PX, IMAGE_SIZE, IMAGE_SIZE);
        }

        context.globalCompositeOperation = image ? "multiply" : "source-over";
        context.fillStyle = `#${mesh.material.color.getHexString()}`;
        context.fillRect(min.x * ATLAS_SIZE_PX, min.y * ATLAS_SIZE_PX, IMAGE_SIZE, IMAGE_SIZE);
      });
    }

    // Draw image for normal map
    {
      const context = contexts["normal"];
      context.globalCompositeOperation = "source-over";
      meshes.forEach((mesh) => {
        const image = getTextureImage(mesh.material, "normalMap");
        const { min, max } = uvs.get(mesh);
        if (image) {
          context.drawImage(image, min.x * ATLAS_SIZE_PX, min.y * ATLAS_SIZE_PX, IMAGE_SIZE, IMAGE_SIZE);
        } else {
          context.fillStyle = "#8080ff"; // default color encodes the vector (0,0,1)
          context.fillRect(min.x * ATLAS_SIZE_PX, min.y * ATLAS_SIZE_PX, IMAGE_SIZE, IMAGE_SIZE);
        }
      });
    }

    // Draw image for orm map(s)
    {
      {
        const context = contexts["orm"];
        meshes.forEach((mesh) => {
          const material = mesh.material;
          const image = getTextureImage(material, "aoMap");
          const { min, max } = uvs.get(mesh);
          if (image) {
            context.globalCompositeOperation = "source-over";
            context.drawImage(image, min.x * ATLAS_SIZE_PX, min.y * ATLAS_SIZE_PX, IMAGE_SIZE, IMAGE_SIZE);
          }

          context.globalCompositeOperation = image ? "multiply" : "source-over";
          const color = new THREE.Color(material.aoMapIntensity, material.roughness, material.metalness);
          context.fillStyle = `#${color.getHexString()}`;
          context.fillRect(min.x * ATLAS_SIZE_PX, min.y * ATLAS_SIZE_PX, IMAGE_SIZE, IMAGE_SIZE);
        });
      }
    }

    // TODO Draw image for emission maps

    // Create textures from canvases
    const textures = Object.fromEntries(
      await Promise.all(
        IMAGE_NAMES.map(async (name) => {
          const texture = new THREE.Texture(await canvasToImage(contexts[name].canvas));
          // TODO: What is encoding?
          texture.encoding = THREE.sRGBEncoding;
          texture.flipY = false;
          return [name, texture];
        })
      )
    );

    return { textures, uvs };
  };
})();
