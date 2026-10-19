import { WorldManager } from './world.js';
import { Player } from './player.js';
import { waterUniforms, initMaterials } from './textures.js';

console.log("🚀 Inicializando motor 3D com iluminação e controles ajustados...");

// Limpa qualquer Canvas antigo do Live Server
const oldCanvas = document.querySelector('canvas');
if (oldCanvas) {
  oldCanvas.remove();
}

// Inicializa materiais
initMaterials();

// Configuração da Cena
const scene = new THREE.Scene();
scene.background = new THREE.Color('#87ceeb');
scene.fog = new THREE.FogExp2('#87ceeb', 0.012);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

// Renderer
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, failIfMajorPerformanceCaveat: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
} catch (e) {
  console.error("❌ Erro ao criar contexto WebGL:", e);
  const errBox = document.getElementById('error-box');
  if (errBox) {
    errBox.style.display = 'block';
    errBox.innerHTML = '<b>❌ ERRO DE GRÁFICOS (WebGL):</b><br>Não foi possível iniciar o renderizador WebGL.';
  }
  throw e;
}

// Iluminação Geral (Aumentado brilho ambiente para remover sombras pretas)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambientLight);

// Luz Solar Dinâmica
const sunLight = new THREE.DirectionalLight(0xfff5ea, 0.85);
sunLight.position.set(50, 100, 50);
sunLight.castShadow = true;

// Configuração do Mapa de Sombras
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 250;
const d = 60;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
sunLight.shadow.bias = -0.0005; // Evita faixas pretas e artefatos
scene.add(sunLight);

// Gerenciador do Mundo
const world = new WorldManager(scene, 4, 2);

// Jogador
const player = new Player(camera, renderer.domElement, world);
player.position.set(8, 25, 8); // Posição inicial no topo

const clock = new THREE.Clock();

// Loop Principal
function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);
  waterUniforms.uTime.value = clock.getElapsedTime();

  // Atualiza física
  player.update(delta);
  world.update(player.position);

  // A luz solar acompanha a posição do jogador para sombras perfeitas
  sunLight.position.set(
    player.position.x + 40,
    player.position.y + 80,
    player.position.z + 40
  );
  sunLight.target.position.copy(player.position);
  sunLight.target.updateMatrixWorld();

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
console.log("✅ Sandbox 3D pronto!");