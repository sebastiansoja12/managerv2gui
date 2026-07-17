FROM node:20-alpine AS build

WORKDIR /app

ARG REACT_APP_SERVER_URL=http://localhost:8080/v2/api
ARG REACT_APP_GATEWAY_URL=http://localhost:8080/v2/api
ARG REACT_APP_VERSION=2026.4
ARG REACT_APP_ENVIRONMENT=development

ENV REACT_APP_SERVER_URL=${REACT_APP_SERVER_URL}
ENV REACT_APP_GATEWAY_URL=${REACT_APP_GATEWAY_URL}
ENV REACT_APP_VERSION=${REACT_APP_VERSION}
ENV REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

