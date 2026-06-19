FROM node:20-alpine

# Cài đặt thư mục làm việc
WORKDIR /usr/src/app

# Copy package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies (bỏ qua devDependencies để giảm dung lượng)
RUN npm install --production

# Copy toàn bộ mã nguồn
COPY . .

# Port mà Cloud Run sẽ tự động cung cấp qua biến môi trường PORT (mặc định 8080)
ENV PORT=8080
EXPOSE 8080

# Chạy ứng dụng
CMD ["npm", "start"]
