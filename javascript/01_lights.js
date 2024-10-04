import * as THREE from "three";

// create an ambient light
const ambientLight = new THREE.AmbientLight(0x666666)

// create a hemisphere light
const hemisphereLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 2 );
hemisphereLight.color.setHSL( 0.6, 1, 0.6 );
hemisphereLight.groundColor.setHSL( 0.095, 1, 0.75 );
hemisphereLight.position.set( 0, 50, 0 );

// create a directional light (based on
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_lights_hemisphere.html)
const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
directionalLight.color.setHSL( 0.1, 1, 0.95 );
directionalLight.position.set( - 1, 1.75, 1 );
directionalLight.position.multiplyScalar( 30 );

directionalLight.castShadow = true;

directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

const d = 50;

directionalLight.shadow.camera.left = - d;
directionalLight.shadow.camera.right = d;
directionalLight.shadow.camera.top = d;
directionalLight.shadow.camera.bottom = - d;

directionalLight.shadow.camera.far = 3500;
directionalLight.shadow.bias = - 0.0001;

export { ambientLight, directionalLight, hemisphereLight}