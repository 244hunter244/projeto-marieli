import { Chunk, CHUNK_SIZE } from './chunk.js';

export class WorldManager {
  constructor(scene, renderDistance = 2) {
    this.scene = scene;
    this.renderDistance = renderDistance;
    this.loadedChunks = new Map();
  }

  getBlock(x, y, z) {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkZ = Math.floor(z / CHUNK_SIZE);
    const key = `${chunkX},${chunkZ}`;

    const chunk = this.loadedChunks.get(key);
    if (!chunk) return null;

    return chunk.blocksData.get(`${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`) || null;
  }

  update(cameraPosition) {
    const currentChunkX = Math.floor(cameraPosition.x / CHUNK_SIZE);
    const currentChunkZ = Math.floor(cameraPosition.z / CHUNK_SIZE);

    const neededChunkKeys = new Set();
    let hdCount = 0;
    let sdCount = 0;

    for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
      for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
        const cx = currentChunkX + x;
        const cz = currentChunkZ + z;
        const key = `${cx},${cz}`;
        neededChunkKeys.add(key);

        const chunkDistance = Math.max(Math.abs(x), Math.abs(z));
        
        // Define o nível de textura baseado na distância do jogador:
        // 0 = Chunk atual do jogador (Texturas HD com Sombras)
        // 1 = Chunks vizinhas (Texturas SD)
        // 2 = Chunks distantes (Cor sólida)
        let lodLevel = 2;
        if (chunkDistance === 0) {
          lodLevel = 0;
          hdCount++;
        } else if (chunkDistance === 1) {
          lodLevel = 1;
          sdCount++;
        }

        if (!this.loadedChunks.has(key)) {
          const newChunk = new Chunk(cx, cz, this.scene);
          newChunk.setLODMode(lodLevel);
          this.loadedChunks.set(key, newChunk);
        } else {
          const chunk = this.loadedChunks.get(key);
          if (chunk) chunk.setLODMode(lodLevel);
        }
      }
    }

    for (const [key, chunk] of this.loadedChunks.entries()) {
      if (!neededChunkKeys.has(key)) {
        if (chunk) chunk.dispose();
        this.loadedChunks.delete(key);
      }
    }

    const statsElem = document.getElementById('stats');
    if (statsElem) {
      statsElem.innerHTML = 
        `Chunk Atual: [${currentChunkX}, ${currentChunkZ}]<br>` +
        `🌟 Chunk HD (Atual): <b>${hdCount}</b><br>` +
        `🎨 Chunks SD (Vizinhas): <b>${sdCount}</b><br>` +
        `📦 Total na GPU: <b>${this.loadedChunks.size} chunks</b>`;
    }
  }
}