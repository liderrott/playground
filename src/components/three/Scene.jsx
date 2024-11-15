import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';
import { BoxHelper } from 'three';  // BoxHelper'ı ekledik

const Model = () => {
  const modelRef = useRef();

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  
  const gltf = useLoader(GLTFLoader, '/models/EKO-21.glb', (loader) => {
    loader.setDRACOLoader(dracoLoader);
  });

  useEffect(() => {
    if (gltf.scene && modelRef.current) {
      gltf.scene.scale.set(0.005, 0.005, 0.005);
      
      // BoxHelper ekle
      const box = new BoxHelper(gltf.scene, 0x0000ff);
      box.material.opacity = 0.25;
      box.material.transparent = true;
      modelRef.current.add(box);
    }
  }, [gltf]);

  return (
    <group ref={modelRef}>
      <primitive object={gltf.scene} />
    </group>
  );
};
const Scene = () => {
  return (
    <div style={{ height: 'calc(100vh - 64px)' }}>
      <Canvas 
        camera={{ 
          position: [4, 4, 4], 
          fov: 50
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Grid 
            args={[10, 10]} 
            position={[0, 0, 0]}
            cellSize={0.5}
            cellColor="#6f6f6f"
          />
          <OrbitControls />
          <Model />
          <axesHelper args={[5]} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;