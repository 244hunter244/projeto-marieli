import { WorldManager } from './world.js';
import { Player } from './player.js';
import { waterUniforms, initMaterials } from './textures.js';

console.log("🚀 Inicializando Sandbox 3D...");

// Limpa instâncias antigas de canvas
document.querySelectorAll('canvas').forEach(c => c.remove());

// OBRIGATÓRIO: Garante que os materiais existem antes de criar as chunks
initMaterials();

// 1. Cena e Câmera
const scene = new THREE.Scene();
scene.background = new THREE.Color('#87ceeb');
scene.fog = new THREE.FogExp2('#87ceeb', 0.012);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// 2. Renderizador
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 3. Iluminação
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(50, 100, 50);
scene.add(sunLight);

// 4. Instanciação
const world = new WorldManager(scene, 2, 1);
const player = new Player(camera, renderer.domElement, world);

const clock = new THREE.Clock();

// 5. Loop de Renderização
function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);

  if (waterUniforms && waterUniforms.uTime) {
    waterUniforms.uTime.value = clock.getElapsedTime();
  }

  player.update(delta);
  world.update(player.position);

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
console.log("✅ Loop de animação ativo!");