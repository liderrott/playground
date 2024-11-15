import React, { Suspense, useEffect, useRef, useState } from 'react'; // useState eklendi
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';
import { BoxHelper } from 'three';

const Model = () => {
  const modelRef = useRef();
  const [boundingBox, setBoundingBox] = useState(null);

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

      // Boyutları hesapla
      const bbox = new THREE.Box3().setFromObject(gltf.scene);
      setBoundingBox(bbox);
    }
  }, [gltf]);

  return (
    <group ref={modelRef}>
      <primitive object={gltf.scene} />
      {boundingBox && (
        <mesh 
          position={[0, 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry 
            args={[
              (boundingBox.max.x - boundingBox.min.x) * 0.1,
              (boundingBox.max.z - boundingBox.min.z) * 0.1
            ]} 
          />
          <meshBasicMaterial 
            color="#0000ff"
            opacity={0.2}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

const Scene = () => {
  return (
    <div style={{ height: 'calc(100vh - 64px)' }}>
      <Canvas 
        camera={{ 
          position: [8, 8, 8],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1}
            castShadow
          />
          <Grid 
            args={[20, 20]}
            position={[0, 0, 0]}
            cellSize={0.5}
            cellColor="#6f6f6f"
            sectionSize={2}
            sectionColor="#9d4b4b"
          />
          <OrbitControls 
            enableDamping={true}
            dampingFactor={0.05}
            minDistance={4}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2}
          />
          <Model />
          <axesHelper args={[10]} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;