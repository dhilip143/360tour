import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const roomIconsRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const [currentRoom, setCurrentRoom] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const rooms = [
    { 
      name: '🛋️', 
      texture: living, 
      cameraTarget: { x: 15, y: 0, z: 0 }, 
      iconPos: { x: 0.92, y: 0.15, z: 0.05 },
      displayName: 'Living Room'
    },
    { 
      name: '🍳', 
      texture: kitchen, 
      cameraTarget: { x: -15, y: 0, z: 0 }, 
      iconPos: { x: -0.92, y: 0.15, z: 0.05 }, 
      displayName: 'Kitchen'
    },
    { 
      name: '🛏️', 
      texture: bedroom, 
      cameraTarget: { x: 0, y: 0, z: 15 }, 
      iconPos: { x: 0.05, y: 0.15, z: 0.92 }, 
      displayName: 'Bedroom'
    },
    { 
      name: '🚿', 
      texture: bathroom, 
      cameraTarget: { x: 0, y: 0, z: -15 }, 
      iconPos: { x: -0.05, y: 0.15, z: -0.92 }, 
      displayName: 'Bathroom'
    }
  ];

  const updateRoomIcons = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    roomIconsRef.current.forEach(icon => scene.remove(icon));
    
    const icons = [];
    if (currentRoom === 0) {
      icons.push(createRoomIcon(1, rooms[1].iconPos));
    }
    
    icons.forEach(icon => scene.add(icon));
    roomIconsRef.current = icons;
  }, [currentRoom, isDarkMode]);

  const createRoomIcon = (index, position) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const bgColor = isDarkMode ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 140, 0, 0.9)';
    const textColor = isDarkMode ? '#000' : '#FFF';
    
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, bgColor);
    gradient.addColorStop(1, bgColor.replace('0.9', '0.4'));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(128, 128, 128, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = isDarkMode ? '#FFF' : '#000';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 128, 122, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = textColor;
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rooms[index].name, 128, 135);
    
    ctx.shadowColor = 'transparent';
    
    ctx.fillStyle = textColor;
    ctx.font = 'bold 22px Arial';
    ctx.fillText(rooms[index].displayName, 128, 210);
    
    const texture = new THREE.CanvasTexture(canvas);
    const geometry = new THREE.PlaneGeometry(9, 9);
    const material = new THREE.MeshBasicMaterial({ 
      map: texture, 
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide
    });
    const icon = new THREE.Mesh(geometry, material);
    
    const posVector = new THREE.Vector3(position.x, position.y, position.z);
    posVector.normalize();
    posVector.multiplyScalar(47);
    icon.position.copy(posVector);
    icon.lookAt(0, 0, 0);
    
    icon.userData = { roomIndex: index };
    icon.userData.originalScale = icon.scale.clone();
    
    return icon;
  };

  const handleKeyDown = useCallback((event) => {
    const controls = controlsRef.current;
    if (!controls) return;

    event.preventDefault();
    const moveSpeed = 0.1;

    switch (event.key) {
      case 'ArrowLeft':  controls.target.x -= moveSpeed; break;
      case 'ArrowRight': controls.target.x += moveSpeed; break;
      case 'ArrowUp':    controls.object.position.multiplyScalar(0.95); break;
      case 'ArrowDown':  controls.object.position.multiplyScalar(1.05); break;
    }
    controls.update();
  }, []);

  const toggleTheme = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    const overlay = document.createElement('div');
    overlay.id = 'theme-transition-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: ${isDarkMode ? '#ffffff' : '#000000'};
      opacity: 0; z-index: 10000; pointer-events: none;
      transition: opacity 0.4s ease-in-out;
    `;
    document.body.appendChild(overlay);
    
    requestAnimationFrame(() => {
      overlay.style.opacity = '0.7';
      setTimeout(() => {
        setIsDarkMode(prev => !prev);
        setTimeout(() => {
          overlay.style.opacity = '0';
          setTimeout(() => {
            if (document.body.contains(overlay)) {
              document.body.removeChild(overlay);
            }
            setIsTransitioning(false);
          }, 400);
        }, 300);
      }, 200);
    });
  };

  // ✅ PARALLAX EFFECT - Smooth camera movement + texture transition
  const parallaxTransition = (targetRoomIndex) => {
    setIsTransitioning(true);
    
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const sphere = sphereRef.current;
    const textureLoader = new THREE.TextureLoader();
    const room = rooms[targetRoomIndex];
    
    if (!camera || !controls || !sphere) return;

    // Start position
    const startCameraPos = camera.position.clone();
    const startTarget = controls.target.clone();
    
    // End position (parallax effect)
    const targetDirection = new THREE.Vector3(room.cameraTarget.x, room.cameraTarget.y, room.cameraTarget.z).normalize();
    const endCameraPos = targetDirection.clone().multiplyScalar(8);
    const endTarget = new THREE.Vector3(room.cameraTarget.x, room.cameraTarget.y, room.cameraTarget.z);

    let progress = 0;
    const duration = 1200; // 1.2 seconds
    const startTime = Date.now();

    const texture = textureLoader.load(room.texture);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);
      
      // Easing function (smooth parallax)
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      // Interpolate camera position
      camera.position.lerpVectors(startCameraPos, endCameraPos, easedProgress);
      
      // Interpolate controls target
      controls.target.lerpVectors(startTarget, endTarget, easedProgress);
      
      // Texture fade transition
      if (progress > 0.3) {
        sphere.material.map = texture;
        sphere.material.needsUpdate = true;
      }
      
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentRoom(targetRoomIndex);
        setIsTransitioning(false);
      }
    };
    
    animate();
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = isDarkMode ? new THREE.Color(0x111111) : new THREE.Color(0xf5f5f5);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(isDarkMode ? 0x000000 : 0xffffff, 0);
    mount.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const geometry = new THREE.SphereGeometry(50, 64, 64);
    const material = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      color: isDarkMode ? 0x333333 : 0xffffff
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;

    updateRoomIcons();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 1;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    camera.position.set(0, 0, 0.1);

    const handleClick = (event) => {
      if (isTransitioning) return;
      
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      const intersects = raycasterRef.current.intersectObjects(roomIconsRef.current);
      if (intersects.length > 0) {
        const clickedIcon = intersects[0].object;
        const roomIndex = clickedIcon.userData.roomIndex;
        
        // Icon click feedback
        clickedIcon.scale.multiplyScalar(1.3);
        setTimeout(() => {
          clickedIcon.scale.copy(clickedIcon.userData.originalScale);
        }, 200);
        
        // ✅ PARALLAX TRANSITION
        parallaxTransition(roomIndex);
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      
      roomIconsRef.current.forEach((icon) => {
        icon.visible = true;
        const time = Date.now() * 0.001;
        const pulse = Math.sin(time * 2) * 0.08 + 1;
        icon.scale.setScalar(pulse);
      });
      
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown, true);
      renderer.domElement.removeEventListener('click', handleClick);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      roomIconsRef.current.forEach(icon => scene.remove(icon));
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    updateRoomIcons();
  }, [currentRoom, updateRoomIcons]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = isDarkMode ? new THREE.Color(0x111111) : new THREE.Color(0xf5f5f5);
      if (sphereRef.current) {
        sphereRef.current.material.color.setHex(isDarkMode ? 0x333333 : 0xffffff);
      }
    }
    
    if (rendererRef.current) {
      rendererRef.current.setClearColor(isDarkMode ? 0x000000 : 0xffffff, 0);
    }
    
    updateRoomIcons();
  }, [isDarkMode, updateRoomIcons]);

  const loadRoom = (index) => {
    parallaxTransition(index);
  };

  const resetView = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (camera && controls) {
      camera.position.set(0, 0, 0.1);
      controls.target.set(0, 0, 0);
      controls.update();
      loadRoom(0);
    }
  };

  return (
    <div className={`fixed inset-0 overflow-hidden ${isDarkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-gray-50 to-gray-100'} ${isTransitioning ? 'pointer-events-none' : ''}`}>
      <div className="w-screen h-screen relative" ref={mountRef}>
        {/* ALL JSX REMAINS EXACTLY SAME */}
        <div className="absolute top-8 left-8 flex items-center gap-6 z-50">
          <div className="flex flex-col gap-4">
            {rooms.map((room, index) => (
              <button
                key={index}
                disabled={isTransitioning}
                className={`w-16 h-16 rounded-2xl text-3xl font-bold flex items-center justify-center shadow-2xl transition-all duration-300 ${
                  currentRoom === index 
                    ? (isDarkMode ? 'bg-blue-600 text-white scale-110 shadow-blue-600/50 ring-2 ring-blue-400' : 'bg-blue-500 text-white scale-110 shadow-blue-500/50 ring-2 ring-blue-300')
                    : (isDarkMode ? 'bg-gray-800/80 hover:bg-gray-700/80 text-white hover:scale-105 border border-gray-700' : 'bg-white/80 hover:bg-white text-gray-800 hover:scale-105 border border-gray-200')
                } ${isTransitioning ? 'opacity-60 cursor-not-allowed hover:scale-100' : ''}`}
                onClick={() => loadRoom(index)}
                title={room.displayName}
              >
                {room.name}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute top-8 right-8 flex items-center gap-4 z-50">
          <button
            onClick={resetView}
            disabled={isTransitioning}
            className={`w-16 h-16 rounded-2xl text-2xl font-bold flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 ${
              isDarkMode ? 'bg-gray-800/80 hover:bg-gray-700/80 text-white border border-gray-700' : 'bg-white/80 hover:bg-white text-gray-800 border border-gray-200'
            } ${isTransitioning ? 'opacity-60 cursor-not-allowed hover:scale-100' : ''}`}
            title="Reset View"
          >
            ↻
          </button>
          
          <button
            onClick={toggleTheme}
            disabled={isTransitioning}
            className={`w-16 h-16 rounded-2xl text-2xl font-bold flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 ${
              isDarkMode ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 hover:from-yellow-300 hover:to-orange-400' : 'bg-gradient-to-br from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800'
            } ${isTransitioning ? 'opacity-60 cursor-not-allowed hover:scale-100' : ''}`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className={`absolute top-32 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl text-lg font-bold z-50 backdrop-blur-sm border shadow-lg transition-all duration-300 ${
          isDarkMode ? 'bg-gray-900/90 text-white border-gray-700 shadow-black/50' : 'bg-white/90 text-gray-800 border-gray-300 shadow-gray-400/30'
        }`}>
          {rooms[currentRoom].displayName}
        </div>

        <div className={`absolute bottom-8 left-8 px-4 py-3 rounded-xl text-sm z-50 backdrop-blur-sm border transition-all duration-300 ${
          isDarkMode ? 'bg-gray-900/90 text-gray-200 border-gray-700' : 'bg-white/90 text-gray-700 border-gray-300'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">Controls:</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded text-xs">← →</span>
            <span className="text-xs opacity-75">Pan left/right</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded text-xs">↑ ↓</span>
            <span className="text-xs opacity-75">Zoom in/out</span>
          </div>
          <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Click round icons for parallax navigation ✨
          </div>
        </div>

        <div className={`absolute bottom-8 right-8 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm border transition-all duration-300 ${
          isDarkMode ? 'bg-gray-900/90 text-yellow-300 border-yellow-500/30' : 'bg-white/90 text-gray-800 border-gray-300'
        }`}>
          {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </div>

        {/* <div className={`absolute top-32 right-8 px-4 py-3 rounded-xl text-sm z-50 backdrop-blur-sm border max-w-xs transition-all duration-300 ${
          isDarkMode ? 'bg-gray-900/90 text-gray-200 border-gray-700' : 'bg-white/90 text-gray-700 border-gray-300'
        }`}> */}
          {/* <div className="font-medium mb-1 flex items-center gap-2">
            <span className="text-lg">✨</span>
            Parallax Navigation
          </div> */}
          {/* <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Click icons for smooth room transitions!
          </div> */}
        {/* </div> */}

        {isTransitioning && (
          <div className={`absolute inset-0 flex items-center justify-center z-40 pointer-events-none`}>
            <div className={`px-8 py-3 rounded-2xl text-lg font-bold backdrop-blur-sm ${
              isDarkMode ? 'bg-gray-900/95 text-yellow-300 border border-yellow-500/50' : 'bg-white/95 text-gray-800 border border-gray-300'
            } shadow-2xl`}>
              Moving to {rooms[currentRoom]?.displayName || 'room'} ✨
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tour;
