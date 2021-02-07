import { findChildrenByType } from "./utils";
import { createTextureAtlas } from "./create-texture-atlas"

export async function combine({ avatar }) {
  const meshes = findChildrenByType(avatar, "SkinnedMesh");
  const { images, uvs } = await createTextureAtlas({ meshes });
  return { images, uvs };
}
