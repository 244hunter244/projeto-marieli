import { WorldManager } from './world.js';
import { Player } from './player.js';
import { waterUniforms, initMaterials } from './textures.js';

console.log("🚀 Inicializando Sandbox 3D...");

// Limpeza preventiva de instâncias antigas
const oldCanvases = document.querySelectorAll('canvas');
oldCanvases.forEach(c => c.remove());

initMaterials();

const scene = new THREE.Scene();
scene.background = new THREE.Color('#87ceeb');
scene.fog = new THREE.FogExp2('#87ceeb', 0.012);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

let renderer = null;

function initWebGLRenderer() {
  const canvas = document.createElement('canvas');
  
  // Trata perda e restauração do contexto sem travar a aplicação
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    console.warn("⚠️ Contexto WebGL retido. Aguardando liberação da GPU...");
  }, false);

  canvas.addEventListener('webglcontextrestored', () => {
    console.log("✅ Contexto WebGL reestabelecido! Reiniciando renderização...");
    if (renderer) renderer.setSize(window.innerWidth, window.innerHeight);
  }, false);

  try {
    const r = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,
      powerPreference: "default",
      failIfMajorPerformanceCaveat: false
    });

    r.setSize(window.innerWidth, window.innerHeight);
    r.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(r.domElement);
    return r;
  } catch (err) {
    console.warn("⚠️ WebGL retido no momento. Aguardando liberação do processo...");
    return null;
  }
}

renderer = initWebGLRenderer();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff5ea, 0.6);
sunLight.position.set(50, 120, 50);
sunLight.castShadow = true;
scene.add(sunLight);

let world = null;
let player = null;

try {
  world = new WorldManager(scene, 2, 1);
  const domTarget = renderer ? renderer.domElement : document.body;
  player = new Player(camera, domTarget, world);
} catch (e) {
  if (window.logGameError) window.logGameError("main.js -> Instanciar Jogo", e);
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  try {
    // Tenta rebind do renderizador caso o WebGL tenha sido liberado pelo navegador
    if (!renderer) {
      renderer = initWebGLRenderer();
      if (renderer && player) {
        player.domElement = renderer.domElement;
      }
    }

    const delta = Math.min(clock.getDelta(), 0.1);

    if (waterUniforms && waterUniforms.uTime) {
      waterUniforms.uTime.value = clock.getElapsedTime();
    }

    if (player) player.update(delta);
    if (world && player) world.update(player.position);

    if (sunLight && player) {
      sunLight.position.set(player.position.x + 30, player.position.y + 60, player.position.z + 30);
      sunLight.target.position.copy(player.position);
      sunLight.target.updateMatrixWorld();
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  } catch (e) {
    if (window.logGameError) window.logGameError("main.js -> animate() Loop", e);
  }
}

window.addEventListener('resize', () => {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

animate();