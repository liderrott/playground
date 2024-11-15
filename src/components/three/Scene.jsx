import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';

const Model = () => {
  const [criticalPoints, setCriticalPoints] = useState([]);
  const [projectedShape, setProjectedShape] = useState(null);
  
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

    const points = new Set();
    const raycaster = new THREE.Raycaster();
    const meshes = [];

    // Tüm mesh'leri topla
    scene.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child);
      }
    });

    // Grid oluştur ve her noktadan aşağı doğru ışın gönder
    const gridSize = 0.2; // 20cm aralıklarla
    const bbox = new THREE.Box3().setFromObject(scene);
    
    for (let x = bbox.min.x; x <= bbox.max.x; x += gridSize) {
      for (let z = bbox.min.z; z <= bbox.max.z; z += gridSize) {
        const origin = new THREE.Vector3(x, bbox.max.y + 1, z);
        const direction = new THREE.Vector3(0, -1, 0);
        
        raycaster.set(origin, direction);
        const intersects = raycaster.intersectObjects(meshes);
        
        if (intersects.length > 0) {
          const point = new THREE.Vector3(
            intersects[0].point.x * scene.scale.x,
            0,
            intersects[0].point.z * scene.scale.x
          );
          points.add(point);
        }
      }
    }

    // Kaydırakların uç noktalarını bul
    meshes.forEach(mesh => {
      if (mesh.geometry) {
        const positions = mesh.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          const vertex = new THREE.Vector3(
            positions[i],
            positions[i + 1],
            positions[i + 2]
          ).applyMatrix4(mesh.matrixWorld);

          // Uç noktaları bul (en uzak noktalar)
          const distance = new THREE.Vector2(vertex.x, vertex.z).length();
          if (distance > bbox.max.x * 0.7) {
            const point = new THREE.Vector3(
              vertex.x * scene.scale.x,
              0,
              vertex.z * scene.scale.x
            );
            points.add(point);
          }
        }
      }
    });

    // Noktaları array'e çevir
    const pointsArray = Array.from(points);

    // İz düşüm şeklini oluştur
    const shape = new THREE.Shape();
    if (pointsArray.length > 0) {
      shape.moveTo(pointsArray[0].x, pointsArray[0].z);
      pointsArray.forEach((point, i) => {
        if (i > 0) {
          shape.lineTo(point.x, point.z);
        }
      });
      shape.lineTo(pointsArray[0].x, pointsArray[0].z);
    }

    setProjectedShape(shape);

    // Debug için noktaları göster
    const debugPoints = pointsArray.map((point, index) => (
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
      {projectedShape && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <shapeGeometry args={[projectedShape]} />
          <meshBasicMaterial color="#4287f5" transparent opacity={0.3} side={THREE.DoubleSide} />
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