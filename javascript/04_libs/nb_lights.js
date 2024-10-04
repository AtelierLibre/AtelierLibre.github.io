import * as THREE from 'three';

const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 3 );
hemiLight.position.set( 0, 20, 0 );

const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
dirLight.position.set( - 3, 10, - 10 );

export { hemiLight, dirLight }