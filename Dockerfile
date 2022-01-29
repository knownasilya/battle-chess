
# Install dependencies only when needed
FROM node:lts-alpine AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --ignore-scripts

# Production image, copy all the files and run Logux
FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S logux -u 1001

# Copy all files
COPY app/ ./app
COPY lib/ ./lib
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

USER logux

EXPOSE 31337

CMD ["yarn", "logux"]