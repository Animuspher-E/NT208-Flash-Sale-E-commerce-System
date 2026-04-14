# Chuyển sang bản Slim (Debian) để tương thích tốt nhất với Prisma và LibSSL
FROM node:20-slim

# Cài đặt openssl cho Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy các file cấu hình
COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt (Bản Slim này sẽ build bcrypt chuẩn Linux Debian)
RUN npm install

# Copy code
COPY . .

# Generate Client cho môi trường Linux
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
