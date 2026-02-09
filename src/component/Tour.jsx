import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import living from '/src/assets/livingroom.webp';
import kitchen from '/src/assets/kitchen.webp';
import bedroom from '/src/assets/bedroom.webp';
import bathroom from '/src/assets/bathroom.webp';

function Tour() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const sphereRef = useRef(null);
  const [currentRoom, setCurrentRoom] = useState(0);

  const rooms = [
    { name: '🛋️', texture: living, cameraTarget: { x: 15, y: 0, z: 0 } },
    { name: '🍳', texture: kitchen, cameraTarget: { x: -15, y: 0, z: 0 } },
    { name: '🛏️', texture: bedroom, cameraTarget: { x: 0, y: 0, z: 15 } },
    { name: '🚿', texture: bathroom, cameraTarget: { x: 0, y: 0, z: -15 } }
  ];

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = null;
    
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const geometry = new THREE.SphereGeometry(50, 64, 64);
    const material = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      color: 0xffffff
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;

    loadRoomTexture(0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 1;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    camera.position.set(0, 0, 0.1);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    function loadRoomTexture(index) {
      const room = rooms[index];
      const textureLoader = new THREE.TextureLoader();

      textureLoader.load(
        room.texture,
        (texture) => {
          sphere.material.map = texture;
          sphere.material.needsUpdate = true;
          setCurrentRoom(index);
        },
        undefined,
        (error) => {
          console.error('Texture load error:', error);
          sphere.material.color.setHex(0xcccccc);
        }
      );
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const animateCameraToTarget = (targetPosition) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    if (!camera || !controls) return;

    const direction = new THREE.Vector3(
      targetPosition.x,
      targetPosition.y,
      targetPosition.z
    ).normalize();

    const targetLookAt = direction.multiplyScalar(10);

    let progress = 0;
    const startRotation = camera.quaternion.clone();
    const tempCamera = camera.clone();
    tempCamera.lookAt(targetLookAt);
    const endRotation = tempCamera.quaternion.clone();

    const animateRotation = () => {
      progress += 0.03;
      if (progress <= 1) {
        camera.quaternion.slerpQuaternions(startRotation, endRotation, progress);
        controls.update();
        requestAnimationFrame(animateRotation);
      }
    };
    animateRotation();
  };

  const loadRoom = (index) => {
    if (sphereRef.current && cameraRef.current) {
      const textureLoader = new THREE.TextureLoader();
      const room = rooms[index];

      textureLoader.load(room.texture, (texture) => {
        sphereRef.current.material.map = texture;
        sphereRef.current.material.needsUpdate = true;
        setCurrentRoom(index);
        animateCameraToTarget(room.cameraTarget);
      });
    }
  };

  const resetView = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (camera && controls) {
      camera.position.set(0, 0, 0.1);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div 
        className="w-screen h-screen"
        ref={mountRef}
      >
        {/* Room icons - FIXED with room names */}
        <div className="absolute top-8 left-8 flex flex-col gap-4 z-50 pointer-events-none">
          <div className="pointer-events-auto flex flex-col gap-4">
            {rooms.map((room, index) => (
              <button
                key={index}
                className={`w-16 h-16 rounded-2xl text-3xl font-bold flex items-center justify-center shadow-2xl transition-all duration-300 ${
                  currentRoom === index 
                    ? 'bg-blue-500 text-white scale-110 shadow-blue-500/50' 
                    : 'bg-white/30 hover:bg-white/50 text-white hover:scale-110'
                }`}
                onClick={() => loadRoom(index)}
                title={`Room ${index + 1}`}
              >
                {room.name}
              </button>
            ))}
          </div>
        </div>

        {/* Reset button - FIXED with icon */}
        <button
          onClick={resetView}
          className="absolute top-8 right-8 w-16 h-16 bg-white/30 hover:bg-white/50 rounded-2xl text-white text-2xl font-bold flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300"
          title="Reset View"
        >
          ↻
        </button>
      </div>
    </div>
  );
}

export default Tour;
