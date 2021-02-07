import * as THREE from "three";

export function createSkydome(radius) {
  const vertexShader = `
varying vec3 vWorldPosition;

void main() {

  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
`;
  const fragmentShader = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;

varying vec3 vWorldPosition;

void main() {

  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );

}
`;

  const offset = radius / 12;

  const uniforms = {
    topColor: { value: new THREE.Color(0x0096db) }, // TODO: match primary color
    bottomColor: { value: new THREE.Color(0xc6dde5) },
    offset: { value: offset },
    exponent: { value: 1.0 },
  };

  // TODO Pixel push these values to perfection!!!
  const geometry = new THREE.SphereGeometry(radius, 16, 16);
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.BackSide,
  });

  return new THREE.Mesh(geometry, material);
}
