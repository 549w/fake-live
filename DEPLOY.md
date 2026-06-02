# 🚀 部署指南 - fake-live

## 服务器信息
- **IP**: YOUR_SERVER_IP
- **域名**: YOUR_DOMAIN
- **端口**: 3000

## 前置要求

### 1. DNS 配置
确保域名 `YOUR_DOMAIN` 已解析到 `YOUR_SERVER_IP`

```
A 记录: YOUR_DOMAIN → YOUR_SERVER_IP
```

### 2. 服务器环境
服务器上需要安装：
- Node.js (推荐 v16+)
- npm
- Nginx

## 自动部署（推荐）

### 方式一：使用部署脚本

```bash
# 1. 赋予执行权限
chmod +x deploy.sh setup-nginx.sh

# 2. 运行部署脚本（会提示输入 SSH 密码）
./deploy.sh

# 3. 配置 Nginx
./setup-nginx.sh
```

### 方式二：手动部署

#### Step 1: 上传文件到服务器

```bash
# 打包项目（排除 node_modules）
tar czf fake-live.tar.gz --exclude=node_modules --exclude=.git package.json server.js public/ README.md

# 上传到服务器
scp fake-live.tar.gz root@YOUR_SERVER_IP:/tmp/

# SSH 登录服务器
ssh root@YOUR_SERVER_IP
```

#### Step 2: 在服务器上操作

```bash
# 创建应用目录
sudo mkdir -p /opt/fake-live
cd /opt/fake-live

# 解压文件
sudo tar xzf /tmp/fake-live.tar.gz
sudo rm /tmp/fake-live.tar.gz

# 安装依赖
sudo npm install --production
```

#### Step 3: 创建 systemd 服务

```bash
sudo tee /etc/systemd/system/fake-live.service > /dev/null << 'EOF'
[Unit]
Description=Fake Live Streaming Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/fake-live
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

StandardOutput=journal
StandardError=journal
SyslogIdentifier=fake-live

[Install]
WantedBy=multi-user.target
EOF
```

#### Step 4: 启动服务

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start fake-live

# 设置开机自启
sudo systemctl enable fake-live

# 查看状态
sudo systemctl status fake-live

# 查看日志
sudo journalctl -u fake-live -f
```

#### Step 5: 配置 Nginx

```bash
# 创建 Nginx 配置文件
sudo tee /etc/nginx/conf.d/YOUR_DOMAIN.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN;

    access_log /var/log/nginx/YOUR_DOMAIN_access.log;
    error_log /var/log/nginx/YOUR_DOMAIN_error.log;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSocket 支持（Socket.IO 必需）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 缓冲设置
        proxy_buffering off;
    }
}
EOF

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

## 🔒 配置 HTTPS（可选但推荐）

由于使用了摄像头，浏览器要求 HTTPS。以下是配置步骤：

### 方式一：使用 Let's Encrypt（免费）

```bash
# 安装 certbot
sudo yum install certbot python3-certbot-nginx  # CentOS/RHEL
# 或
sudo apt install certbot python3-certbot-nginx  # Ubuntu/Debian

# 获取证书并自动配置 Nginx
sudo certbot --nginx -d YOUR_DOMAIN

# 自动续期
sudo crontab -e
# 添加: 0 0 1 * * certbot renew --quiet
```

### 方式二：手动配置 SSL

```bash
# 1. 上传证书文件到服务器
scp your-domain.pem root@YOUR_SERVER_IP:/etc/nginx/ssl/
scp your-domain.key root@YOUR_SERVER_IP:/etc/nginx/ssl/

# 2. 修改 Nginx 配置（参考 setup-nginx.sh 中的注释部分）

# 3. 重新加载 Nginx
sudo nginx -t && sudo systemctl reload nginx
```

## 🧪 验证部署

```bash
# 1. 检查服务状态
sudo systemctl status fake-live

# 2. 检查端口监听
sudo netstat -tlnp | grep 3000

# 3. 测试本地访问
curl http://localhost:3000

# 4. 测试域名访问
curl http://YOUR_DOMAIN

# 5. 查看应用日志
sudo journalctl -u fake-live -f
```

## 📱 访问地址

部署完成后，可通过以下地址访问：

- **主页**: http://YOUR_DOMAIN
- **主播页面**: http://YOUR_DOMAIN/streamer.html
- **控制页面**: http://YOUR_DOMAIN/controller.html

## 🔧 常用管理命令

```bash
# 查看服务状态
sudo systemctl status fake-live

# 重启服务
sudo systemctl restart fake-live

# 停止服务
sudo systemctl stop fake-live

# 查看日志
sudo journalctl -u fake-live -f

# 查看最近 100 行日志
sudo journalctl -u fake-live -n 100

# 更新部署
cd /opt/fake-live
git pull  # 如果使用 git
npm install
sudo systemctl restart fake-live
```

## ⚠️ 注意事项

1. **摄像头权限**: 现代浏览器要求 HTTPS 才能访问摄像头
2. **WebSocket**: Nginx 配置中必须包含 WebSocket 升级头
3. **防火墙**: 确保开放了 80/443 端口
4. **SELinux**: 如果启用，可能需要调整策略

## 🐛 故障排查

### 服务无法启动
```bash
# 查看详细错误
sudo journalctl -u fake-live -n 50

# 检查 Node.js 版本
node --version

# 检查端口占用
sudo lsof -i:3000
```

### Nginx 502 错误
```bash
# 检查后端服务是否运行
sudo systemctl status fake-live

# 检查 Nginx 错误日志
sudo tail -f /var/log/nginx/YOUR_DOMAIN_error.log
```

### WebSocket 连接失败
```bash
# 确认 Nginx 配置包含 upgrade 头
cat /etc/nginx/conf.d/YOUR_DOMAIN.conf | grep -i upgrade
```

---

**部署完成！** 🎉
