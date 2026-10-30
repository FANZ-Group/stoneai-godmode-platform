# StoneAI GOD MODE Platform

The owner's root-authority control plane as a standalone 3D infrastructure platform.

A Halo-style tactical map of your entire estate. Enrolled assets appear as nodes in a 3D scene. Shut off any section, provider, or asset and watch it happen on the map. Every action produces a receipt. The chain detects tampering. Recovery works offline.

## What it is

StoneAI GOD MODE is the highest authority tier within the StoneAI-controlled estate. The human owner is the root authority. No AI system may overrule, veto, downgrade, or lock out GOD MODE. Intelligence does not create authority.

This platform wraps the God Mode control plane (`control-plane`) in a visual, interactive 3D interface. It connects to the God Mode microservice API and renders your infrastructure as a navigable 3D map.

## Quick start

```bash
# 1. Start the God Mode microservice (from control-plane)
cd ../control-plane
GOD_MODE_PASSPHRASE='your passphrase' node --experimental-strip-types --no-warnings godmode/cli.ts setup
GOD_MODE_PASSPHRASE='your passphrase' node --experimental-strip-types --no-warnings godmode/cli.ts serve

# 2. Start the platform (in another terminal)
cd ../stoneai-godmode-platform
npm install
GOD_MODE_API=http://127.0.0.1:8787 npm start

# 3. Open http://localhost:8888
```

## Docker

```bash
docker compose up -d
docker compose exec godmode node --experimental-strip-types --no-warnings godmode/cli.ts setup
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│  StoneAI GOD MODE Platform (this repo)          │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │ 3D Map      │  │ REST API Proxy           │  │
│  │ (Three.js)  │  │ /api/godmode/*           │  │
│  └──────┬──────┘  └──────────┬───────────────┘  │
│         │                    │                  │
└─────────┼────────────────────┼──────────────────┘
          │                    │
          ▼                    ▼
┌─────────────────────────────────────────────────┐
│  God Mode Microservice (control-plane)     │
│  ┌─────────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Cedar Gate  │  │ Engine   │  │ Adapters   │ │
│  │ (policy)    │  │ (auth +  │  │ (SSH, HTTP,│ │
│  │             │  │  dispatch)│  │  process)  │ │
│  └─────────────┘  └──────────┘  └────────────┘ │
│  ┌─────────────┐  ┌──────────┐                 │
│  │ Receipts    │  │ Recovery │                 │
│  │ (hash chain)│  │ (offline)│                 │
│  └─────────────┘  └──────────┘                 │
└─────────────────────────────────────────────────┘
```

## The 3D map

The map renders your enrolled infrastructure as a 3D scene:

- **Nodes** — each enrolled asset is a glowing sphere, colored by device class (server, service, container, network, storage, GPU).
- **Edges** — connections between dependent assets.
- **Grid floor** — Halo-style tactical grid.
- **Interactive** — click a node to see its details (device class, control interface, status, operations, dependencies). Use the action buttons to isolate, stop, or restart.
- **Real-time** — the map polls the God Mode API every 15 seconds and updates node states.
- **Offline fallback** — if the API is unreachable, the map shows demo data labelled "DEMO MODE".

## Connecting external systems

All APIs and AIs can connect to the God Mode microservice API:

```
GET  /healthz                          liveness
GET  /setup                            setup status
POST /setup                            first-boot owner ceremony
GET  /api/godmode/assets               enrolled + discovered assets
GET  /api/godmode/commands             receipt list
GET  /api/godmode/commands/:id         full record (plan + receipts + objections)
POST /api/godmode/commands             issue + dispatch (requires owner grant)
POST /api/godmode/commands/:id/objection  raise an objection
```

The Cedar enforcement plane gates every request. Without a verified owner signature, nothing happens. With one, exactly one authorized operation executes, and a receipt is produced.

## Security

- The owner is the root authority. No AI may self-activate, impersonate, or widen to OWNER_ROOT.
- Identity is cryptographic (Ed25519). Natural-language claims establish nothing.
- Control is not discovery. Only enrolled assets can be controlled.
- Every action produces a receipt. The chain detects tampering and truncation.
- No result is reported as success without independent verification.
- Objections are preserved as evidence and never block execution.
- Recovery works with the engine, the AI, and the network offline.

## License

UNLICENSED — proprietary. © 2026 FanXor Dynamics LLC.
EOF
echo "written"