FROM node:22-slim AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/package.json

RUN pnpm install --frozen-lockfile --filter gruposcoutseptimo-server... --ignore-scripts

COPY server/tsconfig.json server/tsconfig.build.json ./server/
COPY server/src ./server/src

RUN pnpm --dir server run build

FROM node:22-slim AS runtime

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/package.json

RUN pnpm install --prod --frozen-lockfile --filter gruposcoutseptimo-server... --ignore-scripts

COPY --from=build /app/server/dist ./server/dist

RUN chown -R node:node /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080

EXPOSE 8080

USER node

CMD ["node", "server/dist/index.js"]
