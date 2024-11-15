// Gerekli kütüphanelerin import edilmesi
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';
import { LineSegments, EdgesGeometry, LineBasicMaterial } from 'three';

// Model komponenti - 3D modeli ve kenarlarını yönetir
const Model = () => {
  // Model referansı ve bounding box state'i
  const modelRef = useRef();
  const [boundingBox, setBoundingBox] = useState(null);

  // Draco loader kurulumu (model sıkıştırma çözücü)
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  
  // GLTF modelini yükleme
  const gltf = useLoader(GLTFLoader, '/models/EKO-21.glb', (loader) => {
    loader.setDRACOLoader(dracoLoader);
  });

  useEffect(() => {
    if (gltf.scene && modelRef.current) {
      // Modeli ölçeklendirme
      gltf.scene.scale.set(0.3, 0.3, 0.3);

      // Her mesh için kenar çizgisi oluştur
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          // Threshold değeri ile sadece keskin kenarları seç
          const edges = new EdgesGeometry(child.geometry, 15); // 15 derece açı eşiği
          
          // Kenar materyali
          const line = new LineSegments(
            edges,
            new LineBasicMaterial({ 
              color: '#000000',
              linewidth: 1,     // Daha kalın çizgi
              transparent: true,
              opacity: 1      // Daha belirgin
            })
          );

          // Kenarları mesh'in parent'ına ekle (daha doğru pozisyon için)
          child.parent.add(line);
          
          // Kenarların pozisyonunu ve ölçeğini ayarla
          line.position.copy(child.position);
          line.rotation.copy(child.rotation);
          line.scale.copy(child.scale);
          
          // Debug için mesh adını yazdır
          console.log('Mesh found:', child.name);
        }
      });

      // Boyutları hesapla
      const bbox = new THREE.Box3().setFromObject(gltf.scene);
      const center = new THREE.Vector3();
      bbox.getCenter(center);
      
      // Bounding box bilgilerini state'e kaydet
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
      {/* 3D modeli sahneye ekle */}
      <primitive object={gltf.scene} />
      
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

// Ana sahne komponenti
const Scene = () => {
  return (
    <div style={{ height: 'calc(100vh - 64px)' }}>
      <Canvas 
        camera={{ 
          position: [8, 8, 8], // Kamera pozisyonu
          fov: 50,            // Görüş açısı
          near: 0.1,          // Yakın kesme düzlemi
          far: 1000           // Uzak kesme düzlemi
        }}
        shadows
      >
        <Suspense fallback={null}>
          {/* Işıklandırma */}
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1}
            castShadow
          />

          {/* Zemin ızgarası */}
          <Grid 
            args={[20, 20]}
            position={[0, 0, 0]}
            cellSize={0.5}
            cellColor="#6f6f6f"
            sectionSize={2}
            sectionColor="#9d4b4b"
          />

          {/* Kamera kontrolleri */}
          <OrbitControls 
            enableDamping={true}
            dampingFactor={0.05}
            minDistance={4}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2}
          />

          {/* 3D model */}
          <Model />

          {/* Eksen yardımcısı */}
          <axesHelper args={[10]} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;