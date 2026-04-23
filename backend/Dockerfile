FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

EXPOSE 3000

CMD ["npx", "ts-node-dev", "--respawn", "--transpile-only", "src/main.ts"]
