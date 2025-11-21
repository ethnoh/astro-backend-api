# 1) Base image Node + Python
FROM node:18-bullseye

# 2) Install python + pip + fonts
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN rm -rf .next
RUN npm run build

# ✅ вернуть так:
CMD ["npm", "start"]
