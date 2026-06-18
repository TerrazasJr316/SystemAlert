FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 50051

CMD ["node", "index.js"]
