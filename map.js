// map.js — StoneAI GOD MODE 3D Infrastructure Map
// Halo-style tactical display. Renders enrolled assets as nodes in a 3D scene.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const API_BASE = (window.GOD_MODE_API || '').replace(/\/$/, '') || '';

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x05080f, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05080f, 0.015);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 40, 60);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2.1;
controls.minDistance = 10;
controls.maxDistance = 200;

// Lighting
scene.add(new THREE.AmbientLight(0x223344, 0.6));
const key = new THREE.DirectionalLight(0x00c8ff, 1.2);
key.position.set(30, 50, 20);
scene.add(key);
const rim = new THREE.DirectionalLight(0x00ff88, 0.6);
rim.position.set(-30, 20, -20);
scene.add(rim);

// Grid floor (Halo-style)
const grid = new THREE.GridHelper(200, 40, 0x00c8ff, 0x0a1a2a);
grid.material.opacity = 0.35;
grid.material.transparent = true;
scene.add(grid);

// Ground plane (subtle)
const planeGeo = new THREE.PlaneGeometry(200, 200);
const planeMat = new THREE.MeshBasicMaterial({ color: 0x05080f, transparent: true, opacity: 0.0 });
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.01;
scene.add(plane);

// Asset class → color
const CLASS_COLORS = {
  server: 0x00c8ff,
  service: 0x00ff88,
  application: 0x00ff88,
  container: 0xffaa00,
  network: 0xff4466,
  router: 0xff4466,
  switch: 0xff4466,
  firewall: 0xff4466,
  storage: 0xaa66ff,
  database: 0xaa66ff,
  gpu_system: 0xff00ff,
  ai_model: 0xff00ff,
  ai_agent: 0x00ffff,
  default: 0x888888,
};

function colorFor(cls) {
  return CLASS_COLORS[cls] || CLASS_COLORS.default;
}

// State
const nodes = new Map(); // asset_id → { mesh, data, glow }
const edges = new Map(); // "a|b" → line
let selectedId = null;
let assets = [];
let lastFetch = 0;

// Node geometry (shared)
const nodeGeo = new THREE.SphereGeometry(1.6, 32, 32);
const ringGeo = new THREE.RingGeometry(2.2, 2.6, 32);

function makeNode(data) {
  const color = colorFor(data.device_class);
  const mat = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.6,
    metalness: 0.3,
    roughness: 0.4,
  });
  const mesh = new THREE.Mesh(nodeGeo, mat);
  mesh.userData = { asset: data };

  // Glow ring
  const ringMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -1.5;
  mesh.add(ring);

  // Label sprite
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#00c8ff';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(data.asset_id || data.label, 128, 40);
  const tex = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(8, 2, 1);
  sprite.position.y = 3;
  mesh.add(sprite);

  return mesh;
}

function layoutNodes(list) {
  // Arrange in a circle/ring pattern, grouped by device class
  const groups = {};
  for (const a of list) {
    const g = a.device_class || 'other';
    if (!groups[g]) groups[g] = [];
    groups[g].push(a);
  }
  const groupNames = Object.keys(groups);
  const radius = Math.max(15, list.length * 2);
  let idx = 0;
  for (const g of groupNames) {
    const items = groups[g];
    const groupAngle = (groupNames.indexOf(g) / groupNames.length) * Math.PI * 2;
    const groupRadius = radius * 0.6;
    const gx = Math.cos(groupAngle) * groupRadius;
    const gz = Math.sin(groupAngle) * groupRadius;
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      const angle = (i / items.length) * Math.PI * 2;
      const r = 6;
      a._x = gx + Math.cos(angle) * r;
      a._z = gz + Math.sin(angle) * r;
      a._y = 0;
      idx++;
    }
  }
}

function updateNodes() {
  // Remove old nodes
  for (const [id, node] of nodes) {
    if (!assets.find(a => a.asset_id === id)) {
      scene.remove(node.mesh);
      nodes.delete(id);
    }
  }
  // Add/update nodes
  for (const a of assets) {
    if (!nodes.has(a.asset_id)) {
      const mesh = makeNode(a);
      mesh.position.set(a._x || 0, a._y || 0, a._z || 0);
      scene.add(mesh);
      nodes.set(a.asset_id, { mesh, data: a });
    } else {
      const node = nodes.get(a.asset_id);
      node.data = a;
      // Update emissive based on state
      const mat = node.mesh.material;
      if (a.state === 'offline' || a.state === 'isolated') {
        mat.emissiveIntensity = 0.1;
        mat.color.setHex(0x666666);
        mat.emissive.setHex(0x666666);
      } else {
        mat.emissiveIntensity = 0.6;
        mat.color.setHex(colorFor(a.device_class));
        mat.emissive.setHex(colorFor(a.device_class));
      }
    }
  }
  // Draw edges (simple: connect assets in the same group)
  // For now, connect all nodes to their nearest neighbor
  rebuildEdges();
}

function rebuildEdges() {
  // Remove old edges
  for (const [key, line] of edges) {
    scene.remove(line);
  }
  edges.clear();
  const nodeList = [...nodes.values()];
  for (let i = 0; i < nodeList.length; i++) {
    for (let j = i + 1; j < nodeList.length; j++) {
      const a = nodeList[i].mesh.position;
      const b = nodeList[j].mesh.position;
      const dist = a.distanceTo(b);
      if (dist < 25) {
        const geo = new THREE.BufferGeometry().setFromPoints([a.clone(), b.clone()]);
        const mat = new THREE.LineBasicMaterial({ color: 0x00c8ff, transparent: true, opacity: 0.15 });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        edges.set(`${i}|${j}`, line);
      }
    }
  }
}

// Raycasting for selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

canvas.addEventListener('click', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const meshes = [...nodes.values()].map(n => n.mesh);
  const hits = raycaster.intersectObjects(meshes);
  if (hits.length > 0) {
    const asset = hits[0].object.userData.asset;
    selectAsset(asset.asset_id);
  } else {
    selectAsset(null);
  }
});

function selectAsset(id) {
  selectedId = id;
  const detail = document.getElementById('detail');
  const rows = document.getElementById('detail-rows');
  const title = document.getElementById('detail-title');
  if (!id) {
    detail.style.display = 'none';
    return;
  }
  const node = nodes.get(id);
  if (!node) return;
  const d = node.data;
  title.textContent = d.asset_id || d.label;
  rows.innerHTML = '';
  const fields = [
    ['Device Class', d.device_class],
    ['Control Interface', d.control_interface],
    ['Status', d.state || 'unknown'],
    ['Enrolled By', (d.authorization && d.authorization.enrolled_by) || '—'],
    ['Operations', (d.authorization && d.authorization.operations) ? d.authorization.operations.join(', ') : '—'],
    ['Dependencies', (d.depends_on || []).join(', ') || '—'],
  ];
  for (const [k, v] of fields) {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<span class="k">${k}</span><span class="v">${v}</span>`;
    rows.appendChild(row);
  }
  detail.style.display = 'block';

  // Highlight selected node
  for (const [aid, n] of nodes) {
    const mat = n.mesh.material;
    if (aid === id) {
      mat.emissiveIntensity = 1.2;
    } else {
      mat.emissiveIntensity = 0.4;
    }
  }
}

// Buttons
document.getElementById('btn-isolate').addEventListener('click', () => controlAsset('isolate'));
document.getElementById('btn-stop').addEventListener('click', () => controlAsset('stop'));
document.getElementById('btn-restart').addEventListener('click', () => controlAsset('restart'));

async function controlAsset(op) {
  if (!selectedId) return;
  showToast(`Dispatching ${op} on ${selectedId}...`);
  try {
    const res = await fetch(`${API_BASE}/api/godmode/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: selectedId, operation: op }),
    });
    const data = await res.json();
    if (data.verified) {
      showToast(`${op} on ${selectedId}: VERIFIED`);
    } else {
      showToast(`${op} on ${selectedId}: ${data.final_state || 'UNKNOWN'}`);
    }
    await fetchAssets();
  } catch (e) {
    showToast(`Error: ${e.message}`);
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// Fetch assets from the God Mode API
async function fetchAssets() {
  try {
    const res = await fetch(`${API_BASE}/api/godmode/assets`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const list = (data.data && data.data.enrolled) ? data.data.enrolled : (data.enrolled || []);
    assets = list.map(a => ({
      asset_id: a.asset_id,
      label: a.label || a.asset_id,
      device_class: a.device_class || 'default',
      control_interface: a.control_interface,
      authorization: a.authorization,
      depends_on: a.dependencies || [],
      state: 'online',
    }));
    layoutNodes(assets);
    updateNodes();
    updateStats();
    document.getElementById('status-left').textContent = 'CONNECTED — ' + assets.length + ' assets';
  } catch (e) {
    // Fall back to demo data
    if (assets.length === 0) {
      assets = demoAssets();
      layoutNodes(assets);
      updateNodes();
      updateStats();
    }
    document.getElementById('status-left').textContent = 'DEMO MODE — ' + e.message;
  }
}

function demoAssets() {
  return [
    { asset_id: 'primary-db', label: 'Primary DB', device_class: 'database', state: 'online', depends_on: [], authorization: { operations: ['restart', 'stop'] } },
    { asset_id: 'app-server-01', label: 'App Server 1', device_class: 'server', state: 'online', depends_on: ['primary-db'], authorization: { operations: ['restart', 'stop'] } },
    { asset_id: 'app-server-02', label: 'App Server 2', device_class: 'server', state: 'online', depends_on: ['primary-db'], authorization: { operations: ['restart', 'stop'] } },
    { asset_id: 'redis-cache', label: 'Redis Cache', device_class: 'service', state: 'online', depends_on: ['primary-db'], authorization: { operations: ['restart', 'stop'] } },
    { asset_id: 'nginx-lb', label: 'Nginx LB', device_class: 'network', state: 'online', depends_on: ['app-server-01', 'app-server-02'], authorization: { operations: ['restart', 'stop'] } },
    { asset_id: 'vault-storage', label: 'Vault Storage', device_class: 'storage', state: 'online', depends_on: [], authorization: { operations: ['restart', 'stop'] } },
    { asset_id: 'gpu-node-01', label: 'GPU Node 1', device_class: 'gpu_system', state: 'online', depends_on: [], authorization: { operations: ['restart', 'stop'] } },
    { asset_id: 'container-01', label: 'Container 1', device_class: 'container', state: 'online', depends_on: ['app-server-01'], authorization: { operations: ['restart', 'stop'] } },
  ];
}

function updateStats() {
  document.getElementById('asset-count').textContent = assets.length;
  const online = assets.filter(a => a.state !== 'offline' && a.state !== 'isolated').length;
  const offline = assets.filter(a => a.state === 'offline').length;
  const isolated = assets.filter(a => a.state === 'isolated').length;
  document.getElementById('online-count').textContent = online;
  document.getElementById('offline-count').textContent = offline;
  document.getElementById('isolated-count').textContent = isolated;
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  // Pulse selected node
  if (selectedId) {
    const node = nodes.get(selectedId);
    if (node) {
      const t = Date.now() * 0.003;
      node.mesh.scale.setScalar(1 + Math.sin(t) * 0.08);
    }
  }
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initial fetch
fetchAssets();
setInterval(fetchAssets, 15000);
EOF
echo "written"