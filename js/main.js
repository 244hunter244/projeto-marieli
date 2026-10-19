import { WorldManager } from './world.js';
import { Player } from './player.js';
import { waterUniforms, initMaterials } from './textures.js';

console.log("🚀 Inicializando Sandbox 3D com ambiente subaquático corrigido...");

document.querySelectorAll('canvas').forEach(c => c.remove());

initMaterials();

const scene = new THREE.Scene();
const skyColor = new THREE.Color('#87ceeb');
const underwaterColor = new THREE.Color('#0d5a94');

scene.background = skyColor;
scene.fog = new THREE.FogExp2(skyColor, 0.012);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(50, 100, 50);
scene.add(sunLight);

// --- SISTEMA DE BOLHAS SUBAQUÁTICAS ---
const bubbleCount = 60;
const bubbleGeometry = new THREE.BufferGeometry();
const bubblePositions = new Float32Array(bubbleCount * 3);

for (let i = 0; i < bubbleCount * 3; i += 3) {
  bubblePositions[i] = (Math.random() - 0.5) * 20;
  bubblePositions[i + 1] = Math.random() * 10;
  bubblePositions[i + 2] = (Math.random() - 0.5) * 20;
}

bubbleGeometry.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));

const bubbleMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.15,
  transparent: true,
  opacity: 0.7
});

const bubbleParticles = new THREE.Points(bubbleGeometry, bubbleMaterial);
bubbleParticles.visible = false;
scene.add(bubbleParticles);

const world = new WorldManager(scene, 2);
const player = new Player(camera, renderer.domElement, world);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);

  if (waterUniforms && waterUniforms.uTime) {
    waterUniforms.uTime.value = clock.getElapsedTime();
  }

  player.update(delta);
  world.update(player.position);

  // --- CONTROLE DE AMBIENTE SUBAQUÁTICO CORRIGIDO ---
  // Utiliza a flag real do jogador em vez de comparar apenas a altura inicial
  const isUnderwater = player && player.isSubmerged;

  if (isUnderwater) {
    scene.background = underwaterColor;
    scene.fog.color = underwaterColor;
    scene.fog.density = 0.05;

    bubbleParticles.visible = true;
    bubbleParticles.position.copy(player.position);

    const positions = bubbleGeometry.attributes.position.array;
    for (let i = 1; i < bubbleCount * 3; i += 3) {
      positions[i] += delta * 2.5;
      if (positions[i] > 6) positions[i] = -4;
    }
    bubbleGeometry.attributes.position.needsUpdate = true;
  } else {
    scene.background = skyColor;
    scene.fog.color = skyColor;
    scene.fog.density = 0.012;
    bubbleParticles.visible = false;
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();