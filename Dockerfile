FROM node:14.15.4-alpine
WORKDIR /
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
COPY . .
CMD ["node", "."]