FROM node:22-alpine
ENV CI=true
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY . /app
WORKDIR /app

RUN pnpm i;

CMD pnpm run dev & pnpm run companion & pnpm run firehose & wait