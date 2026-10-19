import { WorldManager } from './world.js';
import { Player } from './player.js';
import { waterUniforms, initMaterials } from './textures.js';
import { SkyManager } from './sky.js';

console.log("🚀 Inicializando Sandbox 3D com céu volumétrico...");

document.querySelectorAll('canvas').forEach(c => c.remove());

initMaterials();

const scene = new THREE.Scene();
const skyColor = new THREE.Color('#87ceeb');
const underwaterColor = new THREE.Color('#0b4f8a');

// Névoa atmosférica suave no horizonte
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

// Iluminação direcional quente (Sol)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff5ea, 1.1);
sunLight.position.set(120, 220, -200);
sunLight.castShadow = true;
scene.add(sunLight);

// Inicializa o céu estilizado e o mundo
const skyManager = new SkyManager(scene);
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
  skyManager.update(delta, player.position);

  // Iluminação subaquática vs céu
  if (player.isSubmerged) {
    scene.background = underwaterColor;
    scene.fog.color = underwaterColor;
    scene.fog.density = 0.045;
  } else {
    scene.background = null; // Permite ver a cúpula do céu e o sol
    scene.fog.color = new THREE.Color('#b8d5e5');
    scene.fog.density = 0.008;
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();