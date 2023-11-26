import * as THREE from 'three';

export const darkGreyMaterial = new THREE.MeshLambertMaterial( {color: 0x3A3B3C} );

export const redMaterial = new THREE.MeshLambertMaterial( {color: 0xFF0000} );

export const greenMaterial = new THREE.MeshLambertMaterial( {color: 0x00FF00} );

export const orangeMaterial = new THREE.MeshLambertMaterial( { color: 0xFFA500 } );

export const limeGreenMaterial = new THREE.MeshLambertMaterial( {color: 0x32CD32} );

export const darkLimeGreenMaterial = new THREE.MeshLambertMaterial( {color: 0x208320} );

export const whiteLineDashedMaterial = new THREE.LineDashedMaterial(
    {color: 0xffffff,
        linewidth: 2,
        scale: 1,
        dashSize: 3,
        gapSize: 10,
    }
);

export const limeGreenLineDashedMaterial = new THREE.LineDashedMaterial(
    {color: 0x32CD32,
        linewidth: 2,
        scale: 1,
        dashSize: 3,
        gapSize: 10,
    }
);

export const limeGreenLineBasicMaterial = new THREE.LineBasicMaterial(
    {color: 0x32CD32,
        linewidth: 2,
    }
);

export const darkLimeGreenLineBasicMaterial = new THREE.LineBasicMaterial(
    {color: 0x208320,
        linewidth: 2,
    }
);

// Create some materials
const secondaryStreetMaterial = new THREE.MeshStandardMaterial( { color: 0x7a7461, side: THREE.DoubleSide } );
const primaryStreetMaterial = new THREE.MeshStandardMaterial( { color: 0x474c55, side: THREE.DoubleSide } );
const streetCentreLineMaterial = new THREE.LineDashedMaterial( { color: 0xffffff, linewidth: 2, scale: 1, dashSize: 3, gapSize: 10 } );
const netBlockMaterial = new THREE.MeshStandardMaterial( { color: 0x556B2F, side: THREE.DoubleSide } );