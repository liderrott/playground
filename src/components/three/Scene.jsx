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

    const points = new Set(); // Tekrar eden noktaları otomatik filtrele
    const bbox = new THREE.Box3().setFromObject(scene);
    const bottomY = bbox.min.y;

    // Sadece köşe noktalarını ve ayakları bul
    const cornerPoints = [
      new THREE.Vector3(bbox.min.x, bottomY, bbox.min.z),
      new THREE.Vector3(bbox.min.x, bottomY, bbox.max.z),
      new THREE.Vector3(bbox.max.x, bottomY, bbox.min.z),
      new THREE.Vector3(bbox.max.x, bottomY, bbox.max.z)
    ];

    // Köşe noktalarını ekle
    cornerPoints.forEach(point => {
      point.multiplyScalar(scene.scale.x);
      points.add({
        position: point,
        type: 'corner'
      });
    });

    // Ayakları bul (daha az vertex kontrolü)
    scene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const positions = child.geometry.attributes.position.array;
        const stride = 9; // Her 9 vertexte bir kontrol et (optimizasyon)

        for (let i = 0; i < positions.length; i += stride) {
          const y = positions[i + 1];
          if (Math.abs(y - bottomY) < 0.1) {
            const point = new THREE.Vector3(
              positions[i] * scene.scale.x,
              0,
              positions[i + 2] * scene.scale.x
            );
            points.add({
              position: point,
              type: 'ground'
            });
          }
        }
      }
    });

    setCriticalPoints(Array.from(points));
  }, [gltf]);

  return (
    <group>
      <primitive object={gltf.scene} />
      
      {criticalPoints.map((point, index) => (
        <mesh 
          key={index} 
          position={point.position}
        >
          <sphereGeometry args={[0.02]} />
          <meshBasicMaterial 
            color={point.type === 'ground' ? 'red' : 'blue'} 
          />
        </mesh>
      ))}
    </group>
  );
};