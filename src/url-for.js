export function urlFor(value) {
  if (value.startsWith("blob")) {
    return value;
  } else {
    return `assets/models/${value}.glb`;
  }
}
