import { WorldManager } from './world.js';
import { Player } from './player.js';
import { waterUniforms, initMaterials } from './textures.js';
import { SkyManager } from './sky.js';
import { CharacterManager } from './character.js';

console.log("🚀 Inicializando Sandbox 3D com modelo Steve e braço 1ª Pessoa...");

document.querySelectorAll('canvas').forEach(c => c.remove());

initMaterials();

const scene = new THREE.Scene();
const underwaterColor = new THREE.Color('#0e68a3');

scene.fog = new THREE.FogExp2('#b8d5e5', 0.008);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff5ea, 1.1);
sunLight.position.set(120, 220, -200);
scene.add(sunLight);

// --- PARTÍCULAS DE BOLHAS SUBAQUÁTICAS ---
const bubbleCount = 80;
const bubbleGeometry = new THREE.BufferGeometry();
const bubblePositions = new Float32Array(bubbleCount * 3);

for (let i = 0; i < bubbleCount * 3; i += 3) {
  bubblePositions[i] = (Math.random() - 0.5) * 18;
  bubblePositions[i + 1] = Math.random() * 8;
  bubblePositions[i + 2] = (Math.random() - 0.5) * 18;
}

bubbleGeometry.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));

const bubbleMaterial = new THREE.PointsMaterial({
  color: 0xddffff,
  size: 0.18,
  transparent: true,
  opacity: 0.8
});

const bubbleParticles = new THREE.Points(bubbleGeometry, bubbleMaterial);
bubbleParticles.visible = false;
scene.add(bubbleParticles);

const skyManager = new SkyManager(scene);
const world = new WorldManager(scene, 2);
const player = new Player(camera, renderer.domElement, world);

// Inicializa o modelo 3D do personagem e braço
const character = new CharacterManager(scene, camera);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);

  if (waterUniforms && waterUniforms.uTime) {
    waterUniforms.uTime.value = clock.getElapsedTime();
  }

  player.update(delta);
  world.update(player.position);
  skyManager.update(delta, player.position);

  // Atualiza animações do braço e modelo do personagem
  character.update(delta, player.position, player.velocity, player.isGrounded, player.isSubmerged);

  // Controle do ambiente aquático
  if (player.isSubmerged) {
    scene.background = underwaterColor;
    scene.fog.color = underwaterColor;
    scene.fog.density = 0.038;

    bubbleParticles.visible = true;
    bubbleParticles.position.copy(player.position);

    const positions = bubbleGeometry.attributes.position.array;
    for (let i = 1; i < bubbleCount * 3; i += 3) {
      positions[i] += delta * 2.8;
      if (positions[i] > 5) positions[i] = -3;
    }
    bubbleGeometry.attributes.position.needsUpdate = true;
  } else {
    scene.background = null;
    scene.fog.color = new THREE.Color('#b8d5e5');
    scene.fog.density = 0.008;
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