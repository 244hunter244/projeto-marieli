import { Chunk, CHUNK_SIZE } from './chunk.js';

export class WorldManager {
  // Alterado renderDistance de 4 para 2 e textureRadius de 2 para 1
  constructor(scene, renderDistance = 2, textureRadius = 1) {
    try {
      this.scene = scene;
      this.renderDistance = renderDistance;
      this.textureRadius = textureRadius;
      this.loadedChunks = new Map();
    } catch (e) {
      if (window.logGameError) window.logGameError("world.js -> constructor", e);
    }
  }

  getBlock(x, y, z) {
    try {
      const chunkX = Math.floor(x / CHUNK_SIZE);
      const chunkZ = Math.floor(z / CHUNK_SIZE);
      const key = `${chunkX},${chunkZ}`;

      const chunk = this.loadedChunks.get(key);
      if (!chunk) return null;

      return chunk.blocksData ? (chunk.blocksData.get(`${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`) || null) : null;
    } catch (e) {
      if (window.logGameError) window.logGameError("world.js -> getBlock", e);
      return null;
    }
  }

  update(cameraPosition) {
    try {
      const currentChunkX = Math.floor(cameraPosition.x / CHUNK_SIZE);
      const currentChunkZ = Math.floor(cameraPosition.z / CHUNK_SIZE);

      const neededChunkKeys = new Set();
      let texturedCount = 0;
      let solidCount = 0;

      for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
        for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
          const cx = currentChunkX + x;
          const cz = currentChunkZ + z;
          const key = `${cx},${cz}`;
          neededChunkKeys.add(key);

          const chunkDistance = Math.max(Math.abs(x), Math.abs(z));
          const shouldHaveTexture = chunkDistance <= this.textureRadius;

          if (shouldHaveTexture) texturedCount++;
          else solidCount++;

          if (!this.loadedChunks.has(key)) {
            const newChunk = new Chunk(cx, cz, this.scene);
            newChunk.setLODMode(shouldHaveTexture);
            this.loadedChunks.set(key, newChunk);
          } else {
            const chunk = this.loadedChunks.get(key);
            if (chunk && typeof chunk.setLODMode === 'function') {
              chunk.setLODMode(shouldHaveTexture);
            }
          }
        }
      }

      for (const [key, chunk] of this.loadedChunks.entries()) {
        if (!neededChunkKeys.has(key)) {
          if (chunk && typeof chunk.dispose === 'function') {
            chunk.dispose();
          }
          this.loadedChunks.delete(key);
        }
      }

      const statsElem = document.getElementById('stats');
      if (statsElem) {
        statsElem.innerHTML = 
          `Chunk Atual: [${currentChunkX}, ${currentChunkZ}]<br>` +
          `🎨 Chunks c/ Textura (≤ 1): <b>${texturedCount}</b><br>` +
          `⚡ Chunks Cor Sólida (> 1): <b>${solidCount}</b><br>` +
          `📦 Total na GPU: <b>${this.loadedChunks.size} chunks</b>`;
      }
    } catch (e) {
      if (window.logGameError) window.logGameError("world.js -> update", e);
    }
  }
}