ARG NODE_IMAGE=node:18

FROM $NODE_IMAGE as node-image

FROM node-image

ARG DEFAULT_NODE_ENV=development
ARG DEFAULT_GENERATE_SOURCEMAP=true
ARG DEFAULT_PUBLIC_URL=http://localhost:3000

ENV PATH=/app/node_modules/.bin:$PATH
ENV REACT_APP_PUBLIC_URL=$DEFAULT_PUBLIC_URL
ENV NODE_ENV=$DEFAULT_NODE_ENV
ENV GENERATE_SOURCEMAP=$DEFAULT_GENERATE_SOURCEMAP
ENV BACKEND_LOG_LEVEL=DEBUG
ENV BACKEND_URL='http://0.0.0.0:3500'

WORKDIR /app
COPY ./package*.json ./
RUN npm ci --also=dev
COPY tsconfig.json ./tsconfig.json
COPY rollup.config.js ./rollup.config.js
COPY babel.config.json ./babel.config.json
COPY src ./src
RUN npm run build

CMD [ "node", "./dist/PROJECT-NAME.js" ]
