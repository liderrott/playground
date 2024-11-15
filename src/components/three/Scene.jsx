// Gerekli kütüphanelerin import edilmesi
import React, { Suspense, useEffect, useRef, useState } from 'react'; // React ve hooks'lar
import { Canvas } from '@react-three/fiber'; // 3D sahne oluşturmak için
import { OrbitControls, Grid } from '@react-three/drei'; // Kamera kontrolü ve grid için
import { useLoader } from '@react-three/fiber'; // 3D model yüklemek için
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'; // GLTF formatındaki modelleri yüklemek için
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'; // Sıkıştırılmış modeller için
import * as THREE from 'three'; // Three.js kütüphanesi
import { BoxHelper } from 'three'; // Bounding box oluşturmak için

const Model = () => {
  // Model referansı ve bounding box state'i
  const modelRef = useRef(); // 3D modele referans
  const [boundingBox, setBoundingBox] = useState(null); // Bounding box bilgilerini tutmak için state

  // Draco loader kurulumu (model sıkıştırma çözücü)
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  
  // GLTF modelini yükleme
  const gltf = useLoader(GLTFLoader, '/models/EKO-21.glb', (loader) => {
    loader.setDRACOLoader(dracoLoader);
  });

  useEffect(() => {
    if (gltf.scene && modelRef.current) {
      // Modeli ölçeklendirme (0.1 kat küçültme)
      gltf.scene.scale.set(0.1, 0.1, 0.1);
      
      // Mavi renkli bounding box oluşturma
      const box = new BoxHelper(gltf.scene, 0x0000ff);
      box.material.opacity = 0.25; // Yarı saydam
      box.material.transparent = true;
      modelRef.current.add(box);

      // Modelin boyutlarını ve merkez noktasını hesaplama
      const bbox = new THREE.Box3().setFromObject(gltf.scene);
      const center = new THREE.Vector3();
      bbox.getCenter(center);
      
      // Bounding box bilgilerini state'e kaydetme
      setBoundingBox({
        size: {
          x: (bbox.max.x - bbox.min.x), // Genişlik
          z: (bbox.max.z - bbox.min.z)  // Derinlik
        },
        center: {
          x: center.x * 0.1, // Merkez X (ölçeklendirilmiş)
          z: center.z * 0.1  // Merkez Z (ölçeklendirilmiş)
        }
      });
    }
  }, [gltf]);

  return (
    <group ref={modelRef}>
      <primitive object={gltf.scene} /> {/* 3D modeli sahneye ekleme */}
      {boundingBox && (
        // Zemin yansıması için mesh oluşturma
        <mesh 
          position={[boundingBox.center.x, 0.01, boundingBox.center.z]} // Zeminden biraz yukarıda
          rotation={[-Math.PI / 2, 0, 0]} // Yatay düzlemde
        >
          <planeGeometry 
            args={[boundingBox.size.x, boundingBox.size.z]} // Modelin boyutlarında
          />
          <meshBasicMaterial 
            color="#0000ff" // Mavi renk
            opacity={0.3} // Yarı saydam
            transparent
            side={THREE.DoubleSide} // Çift taraflı görünüm
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