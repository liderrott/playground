useEffect(() => {
  if (gltf.scene) {
    const scene = gltf.scene;
    scene.scale.set(0.005, 0.005, 0.005);
    scene.position.set(0, 0, 0);

    const criticalPoints = [];
    const bbox = new THREE.Box3().setFromObject(scene);
    const bottomY = bbox.min.y;

    scene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const positions = child.geometry.attributes.position.array;
        const matrix = child.matrixWorld;

        // Her vertex için
        for (let i = 0; i < positions.length; i += 3) {
          const vertex = new THREE.Vector3(
            positions[i],
            positions[i + 1],
            positions[i + 2]
          );
          vertex.applyMatrix4(matrix);

          // Zemine değen noktaları bul (ayaklar)
          if (Math.abs(vertex.y - bottomY) < 0.01) {
            const point = new THREE.Vector3(
              vertex.x * scene.scale.x,
              0,
              vertex.z * scene.scale.x
            );
            // Nokta eklemeden önce kontrol et
            if (!criticalPoints.some(p => 
              Math.abs(p.x - point.x) < 0.01 && 
              Math.abs(p.z - point.z) < 0.01
            )) {
              criticalPoints.push(point);
              // Debug için sphere ekle
              const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.02),
                new THREE.MeshBasicMaterial({ color: 'red' })
              );
              sphere.position.copy(point);
              scene.add(sphere);
            }
          }

          // Uç noktaları bul (kaydırakların uçları vs.)
          const distanceFromCenter = new THREE.Vector2(vertex.x, vertex.z).length();
          if (distanceFromCenter > bbox.max.x * 0.8) { // En dış  'lik kısım
            const point = new THREE.Vector3(
              vertex.x * scene.scale.x,
              0,
              vertex.z * scene.scale.x
            );
            // Nokta eklemeden önce kontrol et
            if (!criticalPoints.some(p => 
              Math.abs(p.x - point.x) < 0.01 && 
              Math.abs(p.z - point.z) < 0.01
            )) {
              criticalPoints.push(point);
              // Debug için sphere ekle
              const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.02),
                new THREE.MeshBasicMaterial({ color: 'blue' })
              );
              sphere.position.copy(point);
              scene.add(sphere);
            }
          }
        }
      }
    });

    console.log('Kritik noktalar:', criticalPoints);
  }
}, [gltf]);