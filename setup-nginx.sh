#!/bin/bash

# ============================================
# Nginx 配置脚本 - fake-live
# 域名: YOUR_DOMAIN
# ============================================

SERVER="root@YOUR_SERVER_IP"
DOMAIN="YOUR_DOMAIN"
PORT=3000

echo "🔧 配置 Nginx 反向代理..."

ssh $SERVER << ENDSSH
# 创建 Nginx 配置文件
sudo tee /etc/nginx/conf.d/${DOMAIN}.conf > /dev/null << 'EOF'
# HTTP 配置（如果需要 HTTPS，请看下面的注释）
server {
    listen 80;
    server_name ${DOMAIN};

    # 日志配置
    access_log /var/log/nginx/${DOMAIN}_access.log;
    error_log /var/log/nginx/${DOMAIN}_error.log;

    # 反向代理到 Node.js 应用
    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;

        # WebSocket 支持（Socket.IO 需要）
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        # 其他代理头
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 缓冲设置
        proxy_buffering off;
    }

    # 静态文件缓存（可选优化）
    location ~* \.(html|css|js|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://127.0.0.1:${PORT};
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
}

# 如果需要 HTTPS，取消下面的注释并配置证书
# server {
#     listen 443 ssl http2;
#     server_name ${DOMAIN};
#
#     # SSL 证书配置
#     ssl_certificate /etc/nginx/ssl/${DOMAIN}.pem;
#     ssl_certificate_key /etc/nginx/ssl/${DOMAIN}.key;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#
#     # 其他配置同上
#     location / {
#         proxy_pass http://127.0.0.1:${PORT};
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade \$http_upgrade;
#         proxy_set_header Connection "upgrade";
#         proxy_set_header Host \$host;
#         proxy_set_header X-Real-IP \$remote_addr;
#         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto \$scheme;
#         proxy_connect_timeout 60s;
#         proxy_send_timeout 60s;
#         proxy_read_timeout 60s;
#         proxy_buffering off;
#     }
# }
EOF

# 测试 Nginx 配置
echo "🧪 测试 Nginx 配置..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx 配置正确"

    # 重新加载 Nginx
    echo "🔄 重新加载 Nginx..."
    sudo systemctl reload nginx

    echo ""
    echo "✅ Nginx 配置完成！"
    echo "🌐 访问地址: http://${DOMAIN}"
    echo "📱 主播页面: http://${DOMAIN}/streamer.html"
    echo "💻 控制页面: http://${DOMAIN}/controller.html"
else
    echo "❌ Nginx 配置有误，请检查"
    exit 1
fi

ENDSSH

echo ""
echo "📝 下一步："
echo "1. 确保域名 ${DOMAIN} 已解析到 YOUR_SERVER_IP"
echo "2. 如需 HTTPS，请上传 SSL 证书并修改 Nginx 配置"
