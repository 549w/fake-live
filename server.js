const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 配置 Socket.IO，允许跨域访问
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 提供静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 解析 JSON 请求体
app.use(express.json());

// 存储自定义在线人数（默认为0）和评论历史
let customOnlineCount = 0;
let commentHistory = []; // 存储最近的评论

/**
 * API: 获取当前在线人数（返回自定义设置的人数）
 */
app.get('/online-count', (req, res) => {
  res.json({ count: customOnlineCount });
});

/**
 * API: 设置自定义在线人数
 */
app.post('/set-online-count', (req, res) => {
  const { count } = req.body;

  if (count === undefined || count < 0) {
    return res.status(400).json({ error: '请提供有效的在线人数（>= 0）' });
  }

  customOnlineCount = parseInt(count);

  // 通过 Socket.IO 广播给所有客户端更新在线人数
  io.emit('update-online-count', customOnlineCount);

  console.log(`👥 在线人数已设置为: ${customOnlineCount}`);
  res.json({ success: true, count: customOnlineCount });
});

/**
 * API: 控制页面发送评论到主播页面
 */
app.post('/send-comment', (req, res) => {
  const { username, message } = req.body;

  if (!username || !message) {
    return res.status(400).json({ error: '用户名和消息不能为空' });
  }

  const comment = {
    id: Date.now(),
    username: username.trim(),
    message: message.trim(),
    timestamp: new Date().toISOString()
  };

  // 添加到评论历史（保留最近50条）
  commentHistory.push(comment);
  if (commentHistory.length > 50) {
    commentHistory.shift();
  }

  // 通过 Socket.IO 广播评论给所有客户端
  io.emit('new-comment', comment);

  res.json({ success: true, comment });
});

/**
 * Socket.IO 实时通信
 */
io.on('connection', (socket) => {
  console.log(`用户连接: ${socket.id}`);

  // 向新连接的用户发送当前自定义在线人数和最近的评论
  socket.emit('update-online-count', customOnlineCount);
  socket.emit('comment-history', commentHistory.slice(-10)); // 发送最近10条评论

  // 处理来自客户端的评论消息
  socket.on('send-comment', (data) => {
    const { username, message } = data;

    if (!username || !message) {
      return;
    }

    const comment = {
      id: Date.now(),
      username: username.trim(),
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    // 添加到评论历史
    commentHistory.push(comment);
    if (commentHistory.length > 50) {
      commentHistory.shift();
    }

    // 广播给所有连接的客户端
    io.emit('new-comment', comment);
  });

  // 处理用户断开连接（不再影响在线人数统计）
  socket.on('disconnect', () => {
    console.log(`用户断开连接: ${socket.id}`);
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎬 直播系统服务器运行在 http://localhost:${PORT}`);
  console.log(`📱 主播页面: http://localhost:${PORT}/streamer.html`);
  console.log(`💻 控制页面: http://localhost:${PORT}/controller.html`);
});
