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
  
  const gltf = useLoader(GLTFLoader, '/models/EKO-21.glb', (loader) => {
    loader.setDRACOLoader(dracoLoader);
  });

  useEffect(() => {
    if (!gltf.scene) return;

    const scene = gltf.scene;
    scene.scale.set(0.005, 0.005, 0.005);
    scene.position.set(0, 0, 0);

    const points = [];
    const bbox = new THREE.Box3().setFromObject(scene);
    const bottomY = bbox.min.y;
    const tolerance = 0.05; // 5cm tolerans

    // En alt noktaları bul
    scene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const positions = child.geometry.attributes.position.array;
        const matrix = child.matrixWorld;

        for (let i = 0; i < positions.length; i += 3) {
          const vertex = new THREE.Vector3(
            positions[i],
            positions[i + 1],
            positions[i + 2]
          ).applyMatrix4(matrix);

          // Sadece en alttaki noktaları al
          if (Math.abs(vertex.y - bottomY) < tolerance) {
            const point = new THREE.Vector3(
              vertex.x * scene.scale.x,
              0,
              vertex.z * scene.scale.x
            );

            // Tekrarlayan noktaları filtrele
            if (!points.some(p => 
              Math.abs(p.x - point.x) < tolerance && 
              Math.abs(p.z - point.z) < tolerance
            )) {
              points.push(point);
            }
          }
        }
      }
    });

    // Debug için noktaları göster
    const debugPoints = points.map((point, index) => (
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