FROM node:25.6.0 AS builder

ARG VITE_API_URL
ARG VITE_API_KEY_FRONT
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_KEY_FRONT=$VITE_API_KEY_FRONT

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
