import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';
import { BoxHelper } from 'three';

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
      
      // Normal bounding box
      const box = new BoxHelper(gltf.scene, 0x0000ff);
      box.material.opacity = 0.25;
      box.material.transparent = true;
      modelRef.current.add(box);

      // Yere yansıtılan bounding box
      const bbox = new THREE.Box3().setFromObject(gltf.scene);
      const groundBox = new THREE.Mesh(
        new THREE.BoxGeometry(
          (bbox.max.x - bbox.min.x) * 0.005,
          0.01,
          (bbox.max.z - bbox.min.z) * 0.005
        ),
        new THREE.MeshBasicMaterial({
          color: 0x0000ff,
          opacity: 0.2,
          transparent: true
        })
      );
      
      groundBox.position.set(
        (bbox.max.x + bbox.min.x) * 0.005 / 2,
        0,
        (bbox.max.z + bbox.min.z) * 0.005 / 2
      );
      
      modelRef.current.add(groundBox);

      // Debug için boyutları konsola yazdır
      const size = new THREE.Vector3();
      bbox.getSize(size);
      console.log('Model boyutları:', {
        width: size.x * 0.005,
        height: size.y * 0.005,
        depth: size.z * 0.005
      });
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
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
      >
        <Suspense fallback={null}>
          {/* Işıklar */}
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />

          {/* Grid */}
          <Grid 
            args={[10, 10]} 
            position={[0, 0, 0]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#6f6f6f"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#9d4b4b"
            fadeDistance={30}
            fadeStrength={1}
            followCamera={false}
          />
          
          {/* Kontroller */}
          <OrbitControls 
            enableDamping={true}
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={10}
            maxPolarAngle={Math.PI / 2}
          />
          
          {/* Model */}
          <Model />
          
          {/* Yardımcı eksenler */}
          <axesHelper args={[5]} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;