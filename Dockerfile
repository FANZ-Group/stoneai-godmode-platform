# StoneAI GOD MODE Platform — Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=8888
ENV GOD_MODE_API=http://godmode:8787
EXPOSE 8888
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8888/healthz || exit 1
CMD ["node", "server.js"]
EOF
echo "written"