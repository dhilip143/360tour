import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import living from '/src/assets/livingroom.webp';
import kitchen from '/src/assets/kitchen.webp';
import bedroom from '/src/assets/bedroom.webp';
import bathroom from '/src/assets/bathroom.webp';

function Tour() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const currentTextureRef = useRef(null);

  // Room images array
  const rooms = [
    { name: '🛋️ Living Room', texture: living },
    { name: '🍳 Kitchen', texture: kitchen },
    { name: '🛏️ Bedroom', texture: bedroom },
    { name: '🚿 Bathroom', texture: bathroom }
  ];

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    sceneRef.current = scene;

    // Sphere geometry for panorama
    const geometry = new THREE.SphereGeometry(50, 64, 64);
    const material = new THREE.MeshBasicMaterial({ 
      side: THREE.BackSide,
      color: 0x444444 
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    currentTextureRef.current = sphere;

    // Load first room
    loadRoomTexture(0);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    camera.position.z = 5;

    // Room buttons
    const buttons = rooms.map((room, index) => {
      const btn = document.createElement('div');
      btn.className = `room-btn room-${index}`;
      btn.innerHTML = room.name;
      btn.onclick = () => loadRoomTexture(index);
      return btn;
    });

    // Add buttons to DOM
    const navContainer = document.createElement('div');
    navContainer.className = 'room-nav';
    buttons.forEach(btn => navContainer.appendChild(btn));
    mount.appendChild(navContainer);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Load room texture function
    function loadRoomTexture(index) {
      const room = rooms[index];
      const textureLoader = new THREE.TextureLoader();
      
      textureLoader.load(
        room.texture,
        (texture) => {
          sphere.material.map = texture;
          sphere.material.needsUpdate = true;
          document.querySelectorAll('.room-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
          });
        },
        undefined,
        (error) => {
          console.error('Texture load error:', error);
          sphere.material.color.setHex(0xff0000); // Red for error
        }
      );
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
      mount.removeChild(navContainer);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          🏠 360° Virtual Room Tour
        </h1>
        <p className="text-xl opacity-90 max-w-2xl mx-auto">
          Drag to explore • Click room buttons to switch • Smooth transitions
        </p>
      </header>

      {/* 360 Viewer */}
      <div className="relative w-full aspect-video max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl" ref={mountRef}>
        <style jsx>{`
          .room-nav {
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 100;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .room-btn {
            padding: 12px 20px;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 12px;
            color: white;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
          }
          .room-btn:hover {
            background: rgba(59,130,246,0.3);
            border-color: #3b82f6;
            transform: translateY(-2px);
          }
          .room-btn.active {
            background: rgba(59,130,246,0.6);
            border-color: #3b82f6;
            box-shadow: 0 4px 20px rgba(59,130,246,0.4);
          }
        `}</style>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl font-semibold transition-all shadow-lg">
          ↻ Reset View
        </button>
        <button className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-2xl font-semibold transition-all shadow-lg">
          📱 Fullscreen
        </button>
      </div>
    </div>
  );
}

export default Tour;
