FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p /app/.cache && chown -R node:node /app
ENV NODE_ENV=production
EXPOSE 5000
USER node
CMD ["node", "src/index.js"]
