import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ===== Planet Data =====
const PLANETS = [
  {
    name: 'Mercury', type: 'Terrestrial Planet',
    radius: 0.38, distance: 8,  speed: 4.15, color: 0xb5a7a7,
    rotationSpeed: 0.005, tilt: 0.034,
    info: { diameter: '4,879 km', distanceFromSun: '57.9M km', orbitalPeriod: '88 days', moons: '0', temperature: '−173 to 427°C' }
  },
  {
    name: 'Venus', type: 'Terrestrial Planet',
    radius: 0.95, distance: 12, speed: 1.62, color: 0xe8cda0,
    rotationSpeed: -0.003, tilt: 3.096,
    info: { diameter: '12,104 km', distanceFromSun: '108.2M km', orbitalPeriod: '225 days', moons: '0', temperature: '462°C avg' }
  },
  {
    name: 'Earth', type: 'Terrestrial Planet',
    radius: 1.0, distance: 16, speed: 1.0, color: 0x4a90d9,
    rotationSpeed: 0.02, tilt: 0.409,
    info: { diameter: '12,756 km', distanceFromSun: '149.6M km', orbitalPeriod: '365 days', moons: '1', temperature: '15°C avg' }
  },
  {
    name: 'Mars', type: 'Terrestrial Planet',
    radius: 0.53, distance: 21, speed: 0.53, color: 0xc1440e,
    rotationSpeed: 0.019, tilt: 0.440,
    info: { diameter: '6,792 km', distanceFromSun: '227.9M km', orbitalPeriod: '687 days', moons: '2', temperature: '−65°C avg' }
  },
  {
    name: 'Jupiter', type: 'Gas Giant',
    radius: 3.5, distance: 32, speed: 0.084, color: 0xd4a574,
    rotationSpeed: 0.04, tilt: 0.055,
    info: { diameter: '142,984 km', distanceFromSun: '778.6M km', orbitalPeriod: '11.9 years', moons: '95', temperature: '−110°C avg' }
  },
  {
    name: 'Saturn', type: 'Gas Giant',
    radius: 3.0, distance: 44, speed: 0.034, color: 0xead6a6,
    rotationSpeed: 0.038, tilt: 0.466, hasRing: true,
    info: { diameter: '120,536 km', distanceFromSun: '1,433.5M km', orbitalPeriod: '29.5 years', moons: '146', temperature: '−140°C avg' }
  },
  {
    name: 'Uranus', type: 'Ice Giant',
    radius: 2.0, distance: 56, speed: 0.012, color: 0x72b5c4,
    rotationSpeed: -0.03, tilt: 1.706,
    info: { diameter: '51,118 km', distanceFromSun: '2,872.5M km', orbitalPeriod: '84 years', moons: '28', temperature: '−195°C avg' }
  },
  {
    name: 'Neptune', type: 'Ice Giant',
    radius: 1.9, distance: 68, speed: 0.006, color: 0x3e54e8,
    rotationSpeed: 0.032, tilt: 0.494,
    info: { diameter: '49,528 km', distanceFromSun: '4,495.1M km', orbitalPeriod: '165 years', moons: '16', temperature: '−200°C avg' }
  }
];

// ===== State =====
let speedMultiplier = 0.5;
let selectedPlanet = null;
let hoveredPlanet = null;
let currentBrightness = 1.0;
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const planetMeshes = [];
const labelDivs = [];
let cameraTargetDistance = null; // for zoom control

// ===== Scene Setup =====
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(30, 40, 60);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// ===== Controls =====
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 200;
controls.enablePan = true;
controls.panSpeed = 0.5;
controls.rotateSpeed = 0.6;
controls.target.set(0, 0, 0);

// ===== Lighting =====
const sunLight = new THREE.PointLight(0xffffff, 2.5, 300, 0.5);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x333355, 0.6); // Increased from 0.4
scene.add(ambientLight);

// Add hemisphere light for soft fill on dark sides
const hemiLight = new THREE.HemisphereLight(0x333366, 0x111122, 0.5);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

function updateBrightness(val) {
  currentBrightness = val;
  sunLight.intensity = 2.5 * val;
  ambientLight.intensity = 0.6 * val;
  hemiLight.intensity = 0.5 * val;
  renderer.toneMappingExposure = 1.2 * val;
  document.getElementById('brightness-slider').value = val;
}

// ===== Star Field =====
function createStarField() {
  const starsCount = 5000;
  const positions = new Float32Array(starsCount * 3);
  const colors = new Float32Array(starsCount * 3);
  const sizes = new Float32Array(starsCount);

  for (let i = 0; i < starsCount; i++) {
    const r = 200 + Math.random() * 400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const temp = Math.random();
    if (temp < 0.3) { colors[i * 3] = 0.8; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1.0; }
    else if (temp < 0.6) { colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 0.9; }
    else { colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.7; }

    sizes[i] = 0.5 + Math.random() * 2.0;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.8, vertexColors: true, transparent: true,
    opacity: 0.9, sizeAttenuation: true
  });
  scene.add(new THREE.Points(geo, mat));
}
createStarField();

// ===== Sun =====
function createSun() {
  const sunGeo = new THREE.SphereGeometry(3, 64, 64);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffcc33 });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.userData = {
    name: 'Sun', type: 'G-type Main-Sequence Star',
    info: { diameter: '1,391,000 km', mass: '1.989 × 10³⁰ kg', surfaceTemp: '5,500°C', coreTemp: '15,000,000°C', age: '4.6 billion years' }
  };
  scene.add(sun);
  planetMeshes.push(sun);

  for (let i = 0; i < 3; i++) {
    const glowGeo = new THREE.SphereGeometry(3.5 + i * 0.8, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00, transparent: true, opacity: 0.08 - i * 0.02, side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);
  }
}
createSun();

// ===== Helper: Create Textures =====
function createBandedTexture(baseColor, bandColors) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#' + baseColor.toString(16).padStart(6, '0');
  ctx.fillRect(0, 0, 512, 256);
  const bandHeight = 256 / bandColors.length;
  bandColors.forEach((color, i) => {
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.fillRect(0, i * bandHeight, 512, bandHeight);
    // Blend bands slightly
    const grad = ctx.createLinearGradient(0, i * bandHeight - 10, 0, i * bandHeight + 10);
    grad.addColorStop(0, '#' + baseColor.toString(16).padStart(6, '0'));
    grad.addColorStop(1, '#' + color.toString(16).padStart(6, '0'));
    ctx.fillStyle = grad;
    ctx.fillRect(0, i * bandHeight - 10, 512, 20);
  });
  return new THREE.CanvasTexture(canvas);
}

function createPlanetTexture(baseColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const hex = '#' + baseColor.toString(16).padStart(6, '0');
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 256, 128);
  // Add some noise
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 256, y = Math.random() * 128;
    const r = Math.random() * 3;
    const brightness = 0.8 + Math.random() * 0.4;
    ctx.fillStyle = `rgba(${Math.floor(brightness*255)},${Math.floor(brightness*255)},${Math.floor(brightness*255)},0.05)`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

function createRingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(210,190,150,0.1)');
  grad.addColorStop(0.1, 'rgba(220,200,160,0.6)');
  grad.addColorStop(0.3, 'rgba(200,180,140,0.8)');
  grad.addColorStop(0.45, 'rgba(180,160,120,0.2)'); // Cassini Division
  grad.addColorStop(0.5, 'rgba(190,170,130,0.7)');
  grad.addColorStop(0.8, 'rgba(210,190,150,0.5)');
  grad.addColorStop(1, 'rgba(200,180,140,0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 64);
  return new THREE.CanvasTexture(canvas);
}

function createEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a5276';
  ctx.fillRect(0, 0, 512, 256);
  // Simple continents
  ctx.fillStyle = '#27ae60';
  const continents = [[100,50,80,60],[250,80,60,90],[350,60,70,50],[180,160,100,40]];
  continents.forEach(([x,y,w,h]) => {
    ctx.beginPath(); ctx.ellipse(x,y,w/2,h/2,0,0,Math.PI*2); ctx.fill();
  });
  ctx.fillStyle = '#ffffff'; // ice caps
  ctx.fillRect(0,0,512,15); ctx.fillRect(0,240,512,16);
  // clouds
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  for(let i=0;i<20;i++) { ctx.beginPath(); ctx.ellipse(Math.random()*512, Math.random()*256, 20+Math.random()*40, 5+Math.random()*10, 0, 0, Math.PI*2); ctx.fill(); }
  return new THREE.CanvasTexture(canvas);
}

function createMarsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c1440e';
  ctx.fillRect(0,0,256,128);
  for(let i=0;i<50;i++) {
    ctx.fillStyle = `rgba(${140+Math.random()*60},${40+Math.random()*30},${10+Math.random()*20},0.4)`;
    ctx.beginPath(); ctx.arc(Math.random()*256, Math.random()*128, 3+Math.random()*8, 0, Math.PI*2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(0,0,256,10); ctx.fillRect(0,118,256,10);
  return new THREE.CanvasTexture(canvas);
}

// ===== Create Planets =====
const planetGroup = new THREE.Group();
scene.add(planetGroup);

PLANETS.forEach((data, index) => {
  const orbitGroup = new THREE.Group();
  let texture;
  if (data.name === 'Saturn') {
    texture = createBandedTexture(data.color, [0xead6a6, 0xdcc898, 0xf0e0b8, 0xd0bc88, 0xe4d0a0]);
  } else if (data.name === 'Earth') {
    texture = createEarthTexture();
  } else if (data.name === 'Mars') {
    texture = createMarsTexture();
  } else {
    texture = createPlanetTexture(data.color);
  }

  const geo = new THREE.SphereGeometry(data.radius, 48, 32);
  const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8, metalness: 0.1 });
  const planet = new THREE.Mesh(geo, mat);
  planet.position.x = data.distance;
  planet.rotation.z = data.tilt;
  planet.userData = { planetData: data, index };
  orbitGroup.add(planet);
  planetMeshes.push(planet);

  // FIX: Saturn ring - attach to planet so it orbits together
  if (data.hasRing) {
    const ringGeo = new THREE.RingGeometry(data.radius * 1.4, data.radius * 2.3, 64);
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      uv.setXY(i, (dist - data.radius * 1.4) / (data.radius * 0.9), 0.5);
    }
    const ringTexture = createRingTexture();
    const ringMat = new THREE.MeshBasicMaterial({ map: ringTexture, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    // Attach ring directly to planet
    ring.position.set(0, 0, 0);
    ring.rotation.x = Math.PI * 0.45;
    ring.rotation.z = data.tilt;
    planet.add(ring);
  }

  // Earth's moon
  if (data.name === 'Earth') {
    const moonGeo = new THREE.SphereGeometry(0.27, 24, 16);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.userData.isMoon = true;
    orbitGroup.add(moon);
    planet.userData.moon = moon;
  }

  // Orbit line
  const orbitGeo = new THREE.BufferGeometry();
  const orbitPoints = [];
  for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.02) {
    orbitPoints.push(Math.cos(a) * data.distance, 0, Math.sin(a) * data.distance);
  }
  orbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
  const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 });
  const orbitLine = new THREE.Line(orbitGeo, orbitMat);
  scene.add(orbitLine);

  // CSS2D Label
  const label = document.createElement('div');
  label.className = 'planet-label';
  label.textContent = data.name;
  labelDivs.push({ element: label, planet });

  planetGroup.add(orbitGroup);
  planet.userData.orbitGroup = orbitGroup;
  planet.userData.angle = Math.random() * Math.PI * 2;
});

// ===== Camera Animation =====
let isCameraAnimating = false;
let targetCameraPos = null;
let targetLookAt = null;

function animateCamera(targetPos, lookAt) {
  isCameraAnimating = true;
  targetCameraPos = targetPos;
  targetLookAt = lookAt;
}

// ===== Info Panel =====
const infoPanel = document.getElementById('info-panel');
const planetNameEl = document.getElementById('planet-name');
const planetTypeEl = document.getElementById('planet-type');
const planetColorEl = document.getElementById('planet-color');
const planetStatsEl = document.getElementById('planet-stats');

function showInfoPanel(data) {
  planetNameEl.textContent = data.name;
  planetTypeEl.textContent = data.type;
  const hex = '#' + (data.color || 0xffcc33).toString(16).padStart(6, '0');
  planetColorEl.style.setProperty('--glow', hex);
  planetColorEl.style.background = `radial-gradient(circle at 30% 30%, ${hex}, #000)`;
  planetStatsEl.innerHTML = '';
  const labels = { diameter: 'Diameter', distanceFromSun: 'Distance from Sun', orbitalPeriod: 'Orbital Period', moons: 'Moons', temperature: 'Temperature', mass: 'Mass', surfaceTemp: 'Surface Temp', coreTemp: 'Core Temp', age: 'Age' };
  Object.entries(data.info).forEach(([key, value]) => {
    const div = document.createElement('div');
    div.className = 'stat';
    div.innerHTML = `<span class="label">${labels[key] || key}</span><span class="value">${value}</span>`;
    planetStatsEl.appendChild(div);
  });
  infoPanel.classList.add('visible');
}

document.getElementById('close-panel').addEventListener('click', () => {
  infoPanel.classList.remove('visible');
  selectedPlanet = null;
});

// ===== Raycasting =====
function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes);
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    const data = obj.userData.planetData || obj.userData;
    selectedPlanet = obj;
    if (data.planetData) {
      showInfoPanel(data.planetData);
      const worldPos = new THREE.Vector3();
      obj.getWorldPosition(worldPos);
      const offset = data.planetData.radius * 5 + 5;
      animateCamera(
        new THREE.Vector3(worldPos.x + offset, worldPos.y + offset * 0.5, worldPos.z + offset),
        worldPos
      );
    } else if (data.name === 'Sun') {
      showInfoPanel(data);
      animateCamera(new THREE.Vector3(12, 8, 12), new THREE.Vector3(0, 0, 0));
    }
  }
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes);
  labelDivs.forEach(l => l.element.classList.remove('hovered'));
  renderer.domElement.style.cursor = 'default';
  if (intersects.length > 0) {
    hoveredPlanet = intersects[0].object;
    renderer.domElement.style.cursor = 'pointer';
    labelDivs.forEach(l => { if (l.planet === hoveredPlanet) l.element.classList.add('hovered'); });
  } else {
    hoveredPlanet = null;
  }
}

renderer.domElement.addEventListener('click', onMouseClick);
renderer.domElement.addEventListener('mousemove', onMouseMove);

// ===== Speed Controls =====
document.querySelectorAll('.control-group button[data-speed]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.control-group button[data-speed]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    speedMultiplier = parseFloat(btn.dataset.speed);
  });
});

// ===== Zoom Controls =====
document.getElementById('zoom-in').addEventListener('click', () => {
  const dir = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
  camera.position.addScaledVector(dir, 10);
});
document.getElementById('zoom-out').addEventListener('click', () => {
  const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
  camera.position.addScaledVector(dir, 10);
});
document.getElementById('zoom-reset').addEventListener('click', () => {
  camera.position.set(30, 40, 60);
  controls.target.set(0, 0, 0);
});

// ===== Brightness Controls =====
const brightnessSlider = document.getElementById('brightness-slider');
brightnessSlider.addEventListener('input', (e) => updateBrightness(parseFloat(e.target.value)));
document.getElementById('brightness-down').addEventListener('click', () => {
  updateBrightness(Math.max(0.2, currentBrightness - 0.2));
});
document.getElementById('brightness-up').addEventListener('click', () => {
  updateBrightness(Math.min(3.0, currentBrightness + 0.2));
});

// ===== Resize =====
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== Animation Loop =====
const sun = planetMeshes[0];

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // Animate planets
  planetMeshes.forEach((mesh, i) => {
    if (i === 0) return; // skip sun
    const data = mesh.userData.planetData;
    mesh.userData.angle += data.speed * delta * speedMultiplier * 0.1;

    // Revolution
    mesh.position.x = Math.cos(mesh.userData.angle) * data.distance;
    mesh.position.z = Math.sin(mesh.userData.angle) * data.distance;

    // Self rotation
    mesh.rotation.y += data.rotationSpeed * speedMultiplier;

    // Moon (Earth)
    if (mesh.userData.moon) {
      const moon = mesh.userData.moon;
      const moonAngle = elapsed * 2 * speedMultiplier;
      moon.position.set(
        mesh.position.x + Math.cos(moonAngle) * 2,
        0.3,
        mesh.position.z + Math.sin(moonAngle) * 2
      );
    }
  });

  // Sun pulsing glow
  if (sun) {
    const pulse = 1 + Math.sin(elapsed * 2) * 0.03;
    sun.scale.set(pulse, pulse, pulse);
  }

  // Camera animation
  if (isCameraAnimating && targetCameraPos && targetLookAt) {
    camera.position.lerp(targetCameraPos, 0.04);
    controls.target.lerp(targetLookAt, 0.04);
    if (camera.position.distanceTo(targetCameraPos) < 0.1) {
      isCameraAnimating = false;
    }
  }

  // Update labels
  labelDivs.forEach(({ element, planet }) => {
    if (!planet.parent) return;
    const worldPos = new THREE.Vector3();
    planet.getWorldPosition(worldPos);
    worldPos.y += planet.userData.planetData?.radius || 3.5;

    const screenPos = worldPos.clone().project(camera);
    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

    if (screenPos.z > 1) {
      element.style.display = 'none';
    } else {
      element.style.display = 'block';
      element.style.position = 'fixed';
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.style.transform = 'translate(-50%, -100%)';
    }
  });

  controls.update();
  renderer.render(scene, camera);
}

// ===== Add labels to DOM =====
labelDivs.forEach(({ element }) => document.body.appendChild(element));

// ===== Start =====
animate();

// Hide loader
setTimeout(() => {
  document.getElementById('loader').classList.add('hidden');
}, 1200);

// Auto-hide hint
setTimeout(() => {
  const hint = document.getElementById('controls-hint');
  if (hint) hint.style.opacity = '0';
}, 8000);

console.log('%c🌌 Solar System Explorer loaded!', 'color: #ffc832; font-size: 14px; font-weight: bold;');
