FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ARG NEXT_PUBLIC_RAG_API_BASE_URL=https://health.twift.finance
ARG NEXT_PUBLIC_PERSIAN_FONT=vazirmatn
ARG NEXT_PUBLIC_PERSIAN_FONT_PREVIEW=true
ENV NEXT_PUBLIC_RAG_API_BASE_URL=${NEXT_PUBLIC_RAG_API_BASE_URL}
ENV NEXT_PUBLIC_PERSIAN_FONT=${NEXT_PUBLIC_PERSIAN_FONT}
ENV NEXT_PUBLIC_PERSIAN_FONT_PREVIEW=${NEXT_PUBLIC_PERSIAN_FONT_PREVIEW}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "start", "--", "-p", "3000", "-H", "0.0.0.0"]
