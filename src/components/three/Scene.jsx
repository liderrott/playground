import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';
import { useDrag } from '@use-gesture/react';

const Model = () => {
  const [projectedVertices, setProjectedVertices] = useState([]);
  const [isSelected, setIsSelected] = useState(false);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  dracoLoader.setDecoderConfig({ type: 'js' });
  
  const gltf = useLoader(GLTFLoader, '/models/EKO-21.glb', (loader) => {
    loader.setDRACOLoader(dracoLoader);
  });

  useEffect(() => {
    if (gltf.scene) {
      const scene = gltf.scene;
      scene.scale.set(0.1, 0.1, 0.1);
      scene.position.set(0, 0, 0);

      const groundPoints = [];
      const bbox = new THREE.Box3().setFromObject(scene);
      const bottomY = bbox.min.y;
      const tolerance = 0.5; // 10cm yukarıya kadar olan noktaları al

      scene.traverse((child) => {
        if (child.isMesh && child.geometry) {
          const positions = child.geometry.attributes.position.array;
          const matrix = child.matrixWorld;

          // Her vertex'i kontrol et
          for (let i = 0; i < positions.length; i += 3) {
            const vertex = new THREE.Vector3(
              positions[i],
              positions[i + 1],
              positions[i + 2]
            );
            vertex.applyMatrix4(matrix);

            // Zemine yakın noktaları al
            if (Math.abs(vertex.y - bottomY) <= tolerance) {
              const point = new THREE.Vector2(
                vertex.x * scene.scale.x,
                vertex.y * scene.scale.y
              );
              
              // Tekrarlayan noktaları filtrele
              if (!groundPoints.some(p => 
                Math.abs(p.x - point.x) < 0.01 && 
                Math.abs(p.y - point.y) < 0.01
              )) {
                groundPoints.push(point);
              }
            }
          }
        }
      });

      // Raycasting ile zemine değen noktaları kontrol et
      const raycaster = new THREE.Raycaster();
      const direction = new THREE.Vector3(0, -1, 0);
      const rayPoints = [];

      // Grid üzerinde noktalar oluştur
      const gridSize = 10;
      const step = (bbox.max.x - bbox.min.x) / gridSize;

      for (let x = bbox.min.x; x <= bbox.max.x; x += step) {
        for (let z = bbox.min.z; z <= bbox.max.z; z += step) {
          const origin = new THREE.Vector3(x, bbox.max.y + 1, z);
          raycaster.set(origin, direction);

          const intersects = raycaster.intersectObject(scene, true);
          if (intersects.length > 0) {
            const point = new THREE.Vector2(
              intersects[0].point.x * scene.scale.x,
              intersects[0].point.z * scene.scale.x
            );
            rayPoints.push(point);
          }
        }
      }

      // Tüm noktaları birleştir
      const allPoints = [...groundPoints, ...rayPoints];

      // Convex hull hesapla
      const hull = jarvisMarch(allPoints);
      
      // Noktaları yumuşat ve genişlet
      const expandedHull = expandHull(hull, 0.3);
      const smoothedHull = smoothPoints(expandedHull, 0.15);

      // 3D noktaları oluştur
      const groundProjection = smoothedHull.map(p => 
        new THREE.Vector3(p.x, 0, p.y)
      );

      setProjectedVertices(groundProjection);
    }
  }, [gltf]);

  const expandHull = (points, factor) => {
    const center = new THREE.Vector2();
    points.forEach(p => center.add(p));
    center.divideScalar(points.length);

    return points.map(p => {
      const dir = new THREE.Vector2().subVectors(p, center).normalize();
      return new THREE.Vector2().addVectors(p, dir.multiplyScalar(factor));
    });
  };

  const jarvisMarch = (points) => {
    if (points.length < 3) return points;
    
    const hull = [];
    let leftMost = points.reduce((min, p) => 
      p.x < min.x ? p : min, points[0]
    );
    
    let current = leftMost;
    do {
      hull.push(current);
      let next = points[0];
      
      for (let i = 1; i < points.length; i++) {
        if (next === current || orientation(current, points[i], next) === 2) {
          next = points[i];
        }
      }
      current = next;
    } while (current !== leftMost && hull.length < points.length);
    
    return hull;
  };

  const smoothPoints = (points, factor) => {
    const smoothed = [];
    const len = points.length;
    
    for (let i = 0; i < len; i++) {
      const prev = points[(i - 1 + len) % len];
      const curr = points[i];
      const next = points[(i + 1) % len];
      
      smoothed.push(new THREE.Vector2(
        curr.x + (prev.x + next.x - 2 * curr.x) * factor,
        curr.y + (prev.y + next.y - 2 * curr.y) * factor
      ));
    }
    
    return smoothed;
  };

  const orientation = (p, q, r) => {
    const val = (q.y - p.y) * (r.x - q.x) - 
                (q.x - p.x) * (r.y - q.y);
    if (val === 0) return 0;
    return (val > 0) ? 1 : 2;
  };

  const handleClick = (e) => {
    e.stopPropagation();
    setIsSelected(!isSelected);
  };

  return (
    <group>
      <primitive 
        object={gltf.scene}
        onClick={handleClick}
        onPointerOver={(e) => {
          document.body.style.cursor = 'pointer';
          e.stopPropagation();
        }}
        onPointerOut={(e) => {
          document.body.style.cursor = 'auto';
          e.stopPropagation();
        }}
      />
      
      {projectedVertices.length > 0 && (
        <ProjectedMesh 
          vertices={projectedVertices}
          isSelected={isSelected}
        />
      )}
      
      {isSelected && projectedVertices.map((vertex, index) => (
        <DraggableVertex
          key={index}
          position={vertex}
          onDrag={(x, z) => {
            const newVertices = [...projectedVertices];
            newVertices[index] = new THREE.Vector3(x, 0, z);
            setProjectedVertices(newVertices);
          }}
          color={index === 0 ? '#ff0000' : '#00ff00'}
        />
      ))}
    </group>
  );
};

const ProjectedMesh = ({ vertices, isSelected }) => {
  const shape = new THREE.Shape();
  
  if (vertices.length > 0) {
    shape.moveTo(vertices[0].x, vertices[0].z);
    vertices.forEach((vertex, i) => {
      if (i > 0) shape.lineTo(vertex.x, vertex.z);
    });
    shape.lineTo(vertices[0].x, vertices[0].z);
  }

  return (
    <group position={[0, 0.01, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial 
          color={isSelected ? "#ff4444" : "#4287f5"}
          transparent 
          opacity={isSelected ? 0.6 : 0.3} 
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
        <edgesGeometry args={[new THREE.ShapeGeometry(shape)]} />
        <lineBasicMaterial 
          color={isSelected ? "#ff0000" : "#2166d4"} 
          linewidth={2} 
        />
      </lineSegments>
    </group>
  );
};

const DraggableVertex = ({ position, onDrag, color = 'red' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
  const intersectionPoint = new THREE.Vector3();

  const bind = useDrag(({ active, event }) => {
    if (!event.ray) return;
    setIsDragging(active);
    
    if (active) {
      event.ray.intersectPlane(plane, intersectionPoint);
      onDrag(intersectionPoint.x, intersectionPoint.z);
    }
  });

  return (
    <mesh position={position} {...bind()}>
      <sphereGeometry args={[0.02]} />
      <meshBasicMaterial 
        color={isDragging ? '#ff0000' : color} 
        transparent
        opacity={isDragging ? 0.7 : 1}
      />
    </mesh>
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