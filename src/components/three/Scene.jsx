import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';

const Model = () => {
  const [criticalPoints, setCriticalPoints] = useState([]);
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  
  const gltf = useLoader(GLTFLoader, '/models/1.glb', (loader) => {
    loader.setDRACOLoader(dracoLoader);
  });

  useEffect(() => {
    if (!gltf.scene) return;

    const scene = gltf.scene;
    scene.scale.set(0.005, 0.005, 0.005);
    scene.position.set(0, 0, 0);

    const points = new Set();
    const bbox = new THREE.Box3().setFromObject(scene);

    // Sadece önemli noktaları al
    scene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const geometry = child.geometry;
        const posAttr = geometry.attributes.position;
        const vertices = [];

        // Her 10 noktadan birini al (optimizasyon)
        for (let i = 0; i < posAttr.count; i += 10) {
          vertices.push(new THREE.Vector3().fromBufferAttribute(posAttr, i));
        }

        // Dünya koordinatlarına çevir
        vertices.forEach(vertex => {
          vertex.applyMatrix4(child.matrixWorld);
          
          // En alttaki noktaları bul
          if (Math.abs(vertex.y - bbox.min.y) < 0.1) {
            const point = new THREE.Vector3(
              vertex.x * scene.scale.x,
              0,
              vertex.z * scene.scale.x
            );
            points.add(point);
          }
        });
      }
    });

    // Köşe noktalarını ekle
    const corners = [
      new THREE.Vector3(bbox.min.x, 0, bbox.min.z),
      new THREE.Vector3(bbox.min.x, 0, bbox.max.z),
      new THREE.Vector3(bbox.max.x, 0, bbox.min.z),
      new THREE.Vector3(bbox.max.x, 0, bbox.max.z)
    ].map(p => p.multiplyScalar(scene.scale.x));

    corners.forEach(corner => points.add(corner));

    // Debug noktaları
    const debugPoints = Array.from(points).map((point, index) => (
      <mesh key={index} position={point}>
        <sphereGeometry args={[0.03]} />
        <meshBasicMaterial color="red" />
      </mesh>
    ));

    setCriticalPoints(debugPoints);
  }, [gltf]);

  return (
    <group>
      <primitive object={gltf.scene} />
      {criticalPoints}
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
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
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
          
          <OrbitControls 
            enableDamping={true}
            dampingFactor={0.05}
          />
          
          <Model />
          
          <axesHelper args={[5]} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;