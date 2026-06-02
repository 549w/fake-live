#!/bin/bash

# ============================================
# 部署脚本 - fake-live 项目
# 目标服务器: YOUR_SERVER_IP
# 域名: YOUR_DOMAIN
# ============================================

SERVER="root@YOUR_SERVER_IP"
REMOTE_DIR="/opt/fake-live"
APP_NAME="fake-live"
PORT=3000

echo "🚀 开始部署 fake-live 项目..."

# 1. 打包项目文件（排除 node_modules）
echo "📦 打包项目文件..."
tar czf fake-live.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.DS_Store \
  package.json \
  server.js \
  public/ \
  README.md

# 2. 上传到服务器
echo "📤 上传到服务器..."
scp fake-live.tar.gz $SERVER:/tmp/

# 3. 在服务器上执行部署
echo "🔧 在服务器上部署..."
ssh $SERVER << 'ENDSSH'
  # 创建应用目录
  sudo mkdir -p /opt/fake-live
  cd /opt/fake-live

  # 解压文件
  sudo tar xzf /tmp/fake-live.tar.gz
  sudo rm /tmp/fake-live.tar.gz

  # 安装依赖
  echo "📥 安装 npm 依赖..."
  sudo npm install --production

  # 创建 systemd 服务文件
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

# 日志
StandardOutput=journal
StandardError=journal
SyslogIdentifier=fake-live

[Install]
WantedBy=multi-user.target
EOF

  # 重新加载 systemd
  sudo systemctl daemon-reload

  # 停止旧服务（如果存在）
  sudo systemctl stop fake-live || true

  # 启动新服务
  sudo systemctl start fake-live

  # 设置开机自启
  sudo systemctl enable fake-live

  # 检查服务状态
  echo "✅ 服务状态:"
  sudo systemctl status fake-live --no-pager -l

  # 配置防火墙
  echo "🔥 配置防火墙..."
  sudo firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || \
  sudo ufw allow 3000/tcp 2>/dev/null || \
  echo "⚠️  请手动开放 3000 端口"

ENDSSH

# 清理本地压缩包
rm -f fake-live.tar.gz

echo ""
echo "✅ 部署完成！"
echo "📍 应用地址: http://YOUR_SERVER_IP:3000"
echo "📱 主播页面: http://YOUR_SERVER_IP:3000/streamer.html"
echo "💻 控制页面: http://YOUR_SERVER_IP:3000/controller.html"
echo ""
echo "⚠️  接下来需要配置 Nginx 反向代理，请运行:"
echo "   bash setup-nginx.sh"
