# 1) Base image Node + Python
FROM node:18-bullseye

# 2) Install python + pip + fonts
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# 3) Install Python dependencies
RUN pip3 install \
    requests \
    python-dotenv \
    supabase \
    reportlab \
    pillow

# 4) Workdir
WORKDIR /app

# 5) Install Node deps
COPY package*.json ./
RUN npm install

# 6) Copy full project
COPY . .

# 7) Remove old build
RUN rm -rf .next

# 8) Build Next.js
RUN npm run build

# 9) Start server through Next.js built-in server
CMD ["npm", "start"]
