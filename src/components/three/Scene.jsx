// Gerekli kütüphanelerin import edilmesi
import React, { Suspense, useEffect, useRef, useState } from 'react'; // React ve hooks'lar
import { Canvas } from '@react-three/fiber'; // 3D sahne oluşturmak için
import { OrbitControls, Grid } from '@react-three/drei'; // Kamera kontrolü ve grid için
import { useLoader } from '@react-three/fiber'; // 3D model yüklemek için
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'; // GLTF formatındaki modelleri yüklemek için
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'; // Sıkıştırılmış modeller için
import * as THREE from 'three'; // Three.js kütüphanesi
import { BoxHelper } from 'three'; // Bounding box oluşturmak için
import { Edges, Select } from '@react-three/drei'; // Edges için yeni import

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
      // Modeli ölçeklendirme
      gltf.scene.scale.set(0.1, 0.1, 0.1);

      // Modelin her mesh'ine kenar çizgisi ekleme
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          // Mesh'in geometrisini güncelle
          child.geometry.computeBoundingBox();
          child.geometry.computeBoundingSphere();
        }
      });
      
      // Boyutları hesapla
      const bbox = new THREE.Box3().setFromObject(gltf.scene);
      const center = new THREE.Vector3();
      bbox.getCenter(center);
      
      setBoundingBox({
        size: {
          x: (bbox.max.x - bbox.min.x),
          z: (bbox.max.z - bbox.min.z)
        },
        center: {
          x: center.x * 0.1,
          z: center.z * 0.1
        }
      });
    }
  }, [gltf]);

  return (
    <group ref={modelRef}>
      {/* Model ve kenarları */}
      <Select>
        <primitive object={gltf.scene}>
          {/* Her mesh için kenar çizgisi ekle */}
          <Edges
            threshold={15} // Açı eşiği (derece)
            color="#0000ff" // Kenar rengi
            scale={1} // Kenar kalınlığı
          />
        </primitive>
      </Select>

      {/* Zemin yansıması */}
      {boundingBox && (
        <mesh 
          position={[boundingBox.center.x, 0.01, boundingBox.center.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry 
            args={[boundingBox.size.x, boundingBox.size.z]} 
          />
          <meshBasicMaterial 
            color="#0000ff"
            opacity={0.3}
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
    // Ana container
    <div style={{ height: 'calc(100vh - 64px)' }}> {/* Ekran yüksekliği - header */}
      <Canvas 
        camera={{ 
          position: [8, 8, 8], // Kamera pozisyonu
          fov: 50, // Görüş açısı
          near: 0.1, // Yakın kesme düzlemi
          far: 1000 // Uzak kesme düzlemi
        }}
        shadows
      >
        <Suspense fallback={null}> {/* Model yüklenene kadar beklemek için */}
          <ambientLight intensity={0.5} /> {/* Ortam ışığı */}
          <directionalLight // Yönlü ışık
            position={[10, 10, 5]} 
            intensity={1}
            castShadow
          />
          <Grid // Zemin ızgarası
            args={[20, 20]}
            position={[0, 0, 0]}
            cellSize={0.5}
            cellColor="#6f6f6f"
            sectionSize={2}
            sectionColor="#9d4b4b"
          />
          <OrbitControls // Kamera kontrolleri
            enableDamping={true}
            dampingFactor={0.05}
            minDistance={4}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2}
          />
          <Model /> {/* 3D modeli ekleme */}
          <axesHelper args={[10]} /> {/* X,Y,Z eksenleri gösterimi */}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;