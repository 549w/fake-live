# 🎬 微电影道具 Web 直播系统

这是一个简单、可运行的 Web 直播系统，专为微电影拍摄场景设计。系统包含两个页面：主播页面（移动端）和控制页面（桌面端），通过 WebSocket 实现实时通信。

## ✨ 功能特性

### 主播页面（移动端）
- 📱 调用前置摄像头显示直播画面
- 💬 实时显示评论列表
- ✍️ 支持主播发送评论
- 👥 显示在线人数
- 📐 自适应手机屏幕

### 控制页面（桌面端）
- 👥 实时显示在线观众人数
- 💬 发送自定义评论到主播页面
- ⚡ 快速评论按钮
- 📝 显示最近 10 条评论
- 💻 自适应桌面和平板浏览器

## 🛠️ 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (原生)
- **后端**: Node.js + Express
- **实时通信**: Socket.IO
- **视频**: WebRTC (getUserMedia API)

## 📦 项目结构

```
fake-live/
├── package.json          # 项目配置和依赖
├── server.js             # 后端服务器
├── public/               # 前端静态文件
│   ├── streamer.html     # 主播页面
│   └── controller.html   # 控制页面
└── README.md             # 说明文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务器

```bash
npm start
```

或者开发模式（自动重启）：

```bash
npm run dev
```

### 3. 访问页面

服务器启动后，在浏览器中访问：

- **主播页面**: http://localhost:3000/streamer.html
- **控制页面**: http://localhost:3000/controller.html

## 📱 使用指南

### 在手机上使用主播页面

1. 确保手机和电脑在同一局域网内
2. 查看电脑的 IP 地址：
   - macOS/Linux: `ifconfig | grep "inet "`
   - Windows: `ipconfig`
3. 在手机浏览器中访问: `http://[电脑IP]:3000/streamer.html`
4. 允许浏览器访问摄像头权限
5. 前置摄像头会自动启动并显示画面

### 在电脑上使用控制页面

1. 在电脑浏览器中打开: http://localhost:3000/controller.html
2. 可以看到当前在线人数
3. 输入用户名和评论内容，点击"发送评论"
4. 或使用快速评论按钮一键发送
5. 右侧会实时显示最近的评论

### 测试本地运行

如果只在本地测试，可以：
1. 在一个浏览器标签页打开主播页面
2. 在另一个标签页打开控制页面
3. 两个页面会实时同步数据

## 🔧 API 接口

### 获取在线人数

```
GET /online-count
```

返回：
```json
{
  "count": 5
}
```

### 发送评论

```
POST /send-comment
Content-Type: application/json

{
  "username": "导演",
  "message": "太棒了！"
}
```

返回：
```json
{
  "success": true,
  "comment": {
    "id": 1234567890,
    "username": "导演",
    "message": "太棒了！",
    "timestamp": "2026-05-10T08:00:00.000Z"
  }
}
```

## 🌐 网络配置

### 局域网访问

要让其他设备访问你的服务器：

1. 确保防火墙允许 3000 端口
2. 使用电脑的局域网 IP 地址访问
3. 例如：`http://192.168.1.100:3000`

### 公网访问（可选）

如果需要从外网访问，可以使用以下方案之一：

1. **ngrok** (推荐用于测试):
   ```bash
   npm install -g ngrok
   ngrok http 3000
   ```

2. **端口转发**: 在路由器上配置端口转发到 3000 端口

## ⚙️ 配置选项

### 修改端口号

编辑 `server.js` 文件的最后一行：

```javascript
const PORT = process.env.PORT || 3000; // 修改 3000 为其他端口
```

或者设置环境变量：

```bash
PORT=8080 npm start
```

### 修改默认用户名

在 `controller.html` 中找到：

```html
<input type="text" id="username" value="导演" />
```

修改 `value` 属性即可。

## 🔒 注意事项

1. **摄像头权限**: 首次访问主播页面时，浏览器会请求摄像头权限，必须允许才能看到画面
2. **HTTPS 要求**: 在生产环境中，需要使用 HTTPS 协议才能访问摄像头
3. **浏览器兼容性**: 推荐使用 Chrome、Safari 或 Firefox 等现代浏览器
4. **iOS 限制**: iOS Safari 可能需要用户交互才能播放视频

## 🐛 常见问题

### Q: 摄像头无法启动？
A: 检查以下几点：
- 是否允许了浏览器访问摄像头的权限
- 是否有其他应用正在使用摄像头
- 尝试刷新页面重新授权

### Q: 两个页面无法通信？
A: 确保：
- 服务器正常运行
- 两个页面都连接到同一个服务器
- 检查浏览器控制台是否有错误信息

### Q: 移动端无法访问？
A: 确认：
- 手机和电脑在同一网络
- 使用正确的 IP 地址和端口
- 防火墙未阻止连接

## 📄 许可证

MIT License

---

**祝拍摄顺利！🎬**
