FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

RUN cp -r src/frontend dist/frontend

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
