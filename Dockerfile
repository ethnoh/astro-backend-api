# 1) Base image Node + Python
FROM node:18-bullseye

# 2) Install python3 + pip + fonts
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*

# 3) Python dependencies (включая sendgrid!)
RUN pip3 install \
    requests \
    python-dotenv \
    supabase \
    reportlab \
    pillow \
    sendgrid

# 4) Set workdir
WORKDIR /app

# 5) Install Node deps
COPY package*.json ./
RUN npm install

# 6) Copy full project
COPY . .

# 7) Clean previous builds
RUN rm -rf .next

# 8) Build Next.js
RUN npm run build

# 9) Start
CMD ["npm", "start"]
