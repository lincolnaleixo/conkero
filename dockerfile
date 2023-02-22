#inspired by https://archive.ph/xoQw7
FROM node:18.13.0-alpine3.17 as builder1
# Install required packages
RUN apk add --update --no-cache bash
RUN apk add --no-cache tzdata
RUN ln -sf /usr/share/zoneinfo/America/Los_Angeles /etc/localtime
ENV TIMEZONE=America/Los_Angeles
ENV TZ=America/Los_Angeles

FROM node:18.13.0-alpine3.17 as builder2
COPY --from=builder1 . .
ARG project=conkero
WORKDIR $project
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
RUN yarn