import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';

const Model = () => {
  const modelRef = useRef();

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  
  const gltf = useLoader(GLTFLoader, '/models/EKO-21.glb', (loader) => {
    loader.setDRACOLoader(dracoLoader);
  });

  useEffect(() => {
    if (gltf.scene && modelRef.current) {
      gltf.scene.scale.set(0.1, 0.1, 0.1);
      
      // Bounding box hesapla
      const bbox = new THREE.Box3().setFromObject(gltf.scene);
      
      // Sadece yatay boyutları al
      const size = new THREE.Vector3();
      bbox.getSize(size);
      size.y = 0.1; // Yüksekliği minimize et

      // Box helper'ı yere yerleştir
      if (boxRef.current) {
        boxRef.current.position.set(
          (bbox.max.x + bbox.min.x) / 2,
          bbox.min.y + 0.05, // Yere yakın
          (bbox.max.z + bbox.min.z) / 2
        );
        boxRef.current.scale.set(
          size.x * 0.005, // Scale faktörünü uygula
          size.y,
          size.z * 0.005
        );
      }
    }
  }, [gltf]);

  return (
    <group ref={modelRef}>
      <primitive object={gltf.scene} />
      <mesh ref={boxRef} position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="blue" transparent opacity={0.2} />
      </mesh>
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