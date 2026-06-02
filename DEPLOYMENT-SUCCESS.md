# 部署记录（模板）

> 原文件包含真实服务器信息与本机路径，已脱敏为模板，便于推送 GitHub。

## 服务器信息（占位符）

- IP：`YOUR_SERVER_IP`
- 域名：`YOUR_DOMAIN`
- 端口：`3000`

## 常用管理命令（示例）

```bash
ssh root@YOUR_SERVER_IP

sudo systemctl status fake-live
sudo systemctl restart fake-live
sudo systemctl stop fake-live

sudo journalctl -u fake-live -f
sudo systemctl status nginx
sudo systemctl reload nginx
```

## 访问地址（示例）

- 主页：`https://YOUR_DOMAIN`
- 主播页面：`https://YOUR_DOMAIN/streamer.html`
- 控制页面：`https://YOUR_DOMAIN/controller.html`
