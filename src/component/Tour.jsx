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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(0);

  // Room images array with camera target positions
  const rooms = [
    { 
      name: '🛋️ Living Room', 
      texture: living,
      cameraTarget: { x: 15, y: 0, z: 0 }  // Look right
    },
    { 
      name: '🍳 Kitchen', 
      texture: kitchen,
      cameraTarget: { x: -15, y: 0, z: 0 }  // Look left
    },
    { 
      name: '🛏️ Bedroom', 
      texture: bedroom,
      cameraTarget: { x: 0, y: 0, z: 15 }  // Look front
    },
    { 
      name: '🚿 Bathroom', 
      texture: bathroom,
      cameraTarget: { x: 0, y: 0, z: -15 }  // Look back
    }
  ];

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Sphere geometry for panorama
    const geometry = new THREE.SphereGeometry(50, 64, 64);
    const material = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      color: 0x444444
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;

    // Load first room
    loadRoomTexture(0);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 1;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    camera.position.set(0, 0, 0.1);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Fullscreen change handler
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(handleResize, 100);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Load room texture function
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
          sphere.material.color.setHex(0xff0000);
        }
      );
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Smooth camera animation to target position
  const animateCameraToTarget = (targetPosition) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    if (!camera || !controls) return;

    // Calculate direction vector
    const direction = new THREE.Vector3(
      targetPosition.x,
      targetPosition.y,
      targetPosition.z
    ).normalize();

    // Target look-at point
    const targetLookAt = direction.multiplyScalar(10);

    // Smooth rotation animation
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

  // Smooth camera forward movement
  const moveForward = () => {
    const camera = cameraRef.current;
    if (!camera) return;

    // Get current camera direction and move forward smoothly
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.negate(); // Forward direction
    direction.y = 0; // Keep on same plane
    direction.normalize();

    // Target position (move forward by 3 units)
    const targetPos = camera.position.clone().add(direction.multiplyScalar(3));
    
    let progress = 0;
    const startPos = camera.position.clone();
    
    const animateMove = () => {
      progress += 0.04;
      if (progress <= 1) {
        camera.position.lerpVectors(startPos, targetPos, progress);
        requestAnimationFrame(animateMove);
      }
    };
    animateMove();
  };

  // Smooth camera backward movement
  const moveBackward = () => {
    const camera = cameraRef.current;
    if (!camera) return;

    // Get current camera direction and move backward
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.negate(); // Forward direction
    direction.y = 0;
    direction.normalize();

    // Target position (move backward by 3 units)
    const targetPos = camera.position.clone().sub(direction.multiplyScalar(3));
    
    let progress = 0;
    const startPos = camera.position.clone();
    
    const animateMove = () => {
      progress += 0.04;
      if (progress <= 1) {
        camera.position.lerpVectors(startPos, targetPos, progress);
        requestAnimationFrame(animateMove);
      }
    };
    animateMove();
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

  const toggleFullscreen = () => {
    const elem = mountRef.current;
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Load room and animate camera to its target position
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

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-blue-400 mb-4">
          🏠 360° Virtual Room Tour
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Drag to explore • Click rooms to navigate • Use forward/back to move
        </p>
      </header>

      {/* 360 Viewer */}
      <div 
        className={`relative w-full mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-blue-500/30 ${
          isFullscreen ? 'h-screen max-w-full' : 'aspect-video max-w-5xl'
        }`} 
        ref={mountRef}
      >
        {/* Room Navigation Buttons */}
        <div className="room-nav">
          {rooms.map((room, index) => (
            <button
              key={index}
              className={`room-btn ${currentRoom === index ? 'active' : ''}`}
              onClick={() => loadRoom(index)}
            >
              {room.name}
            </button>
          ))}
        </div>

        {/* Movement Controls - BLACK THEME */}
        <div className="move-controls">
          <button onClick={moveForward} className="move-btn forward" title="Move Forward">
            ⬆️
          </button>
          <button onClick={moveBackward} className="move-btn backward" title="Move Backward">
            ⬇️
          </button>
        </div>

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
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(10px);
            border: 2px solid rgba(59, 130, 246, 0.3);
            border-radius: 12px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
          }
          .room-btn:hover {
            background: rgba(59, 130, 246, 0.4);
            border-color: #3b82f6;
            transform: translateX(4px);
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
          }
          .room-btn.active {
            background: rgba(59, 130, 246, 0.7);
            border-color: #60a5fa;
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5);
          }
          
          .move-controls {
            position: absolute;
            bottom: 20px;
            right: 20px;
            z-index: 100;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .move-btn {
            width: 70px;
            height: 70px;
            background: rgba(17, 24, 39, 0.95);
            backdrop-filter: blur(15px);
            border: 2px solid rgba(75, 85, 99, 0.5);
            border-radius: 50%;
            color: white;
            font-size: 28px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
          }
          .move-btn:hover {
            background: rgba(59, 130, 246, 0.3);
            border-color: rgba(59, 130, 246, 0.6);
            transform: scale(1.1);
            box-shadow: 0 12px 30px rgba(59, 130, 246, 0.3);
          }
          .move-btn:active {
            transform: scale(0.95);
          }
          .forward {
            background: rgba(15, 23, 42, 0.95);
          }
          .forward:hover {
            background: rgba(34, 197, 94, 0.3);
            border-color: rgba(34, 197, 94, 0.6);
            box-shadow: 0 12px 30px rgba(34, 197, 94, 0.3);
          }
          .backward {
            background: rgba(15, 23, 42, 0.95);
          }
          .backward:hover {
            background: rgba(239, 68, 68, 0.3);
            border-color: rgba(239, 68, 68, 0.6);
            box-shadow: 0 12px 30px rgba(239, 68, 68, 0.3);
          }
        `}</style>
      </div>

      {/* Bottom Controls */}
      <div className="flex gap-4 justify-center mt-8">
        <button 
          onClick={resetView}
          className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-all shadow-lg hover:scale-105 active:scale-95 border border-slate-600"
        >
          ↻ Reset View
        </button>
        <button 
          onClick={toggleFullscreen}
          className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-all shadow-lg hover:scale-105 active:scale-95 border border-slate-600"
        >
          {isFullscreen ? '⏹️ Exit Fullscreen' : '⛶ Fullscreen'}
        </button>
      </div>
    </div>
  );
}

export default Tour;
