const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 配置 Socket.IO，允许跨域访问
const io = new Server(server, {
  path: '/live/socket.io',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 提供静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 解析 JSON 请求体
app.use(express.json());

// 存储自定义在线人数（默认为0）、评论历史和 SC 列表
let customOnlineCount = 0;
let commentHistory = []; // 存储最近的评论
let activeSCs = []; // 存储当前活跃的 SC（醒目留言）

/**
 * API: 获取当前在线人数（返回自定义设置的人数）
 */
app.get('/online-count', (req, res) => {
  res.json({ count: customOnlineCount });
});

/**
 * API: 获取当前活跃的 SC 列表
 */
app.get('/active-scs', (req, res) => {
  res.json({ scs: activeSCs });
});

/**
 * API: 设置自定义在线人数（支持平滑过渡）
 */
app.post('/set-online-count', (req, res) => {
  const { count, duration } = req.body;

  if (count === undefined || count < 0) {
    return res.status(400).json({ error: '请提供有效的在线人数（>= 0）' });
  }

  customOnlineCount = parseInt(count);
  
  // 过渡时间（毫秒），默认3秒，范围1-10秒
  const transitionDuration = duration ? Math.min(Math.max(parseInt(duration), 1000), 10000) : 3000;

  // 通过 Socket.IO 广播给所有客户端，包含目标人数和过渡时间
  io.emit('update-online-count', {
    targetCount: customOnlineCount,
    duration: transitionDuration
  });

  console.log(`👥 在线人数将在 ${transitionDuration}ms 内过渡到: ${customOnlineCount}`);
  res.json({ success: true, count: customOnlineCount, duration: transitionDuration });
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
 * API: 删除评论
 */
app.post('/delete-comment', (req, res) => {
  const { commentId } = req.body;

  if (!commentId) {
    return res.status(400).json({ error: '请提供评论 ID' });
  }

  // 从评论历史中删除
  const index = commentHistory.findIndex(c => c.id === commentId);
  if (index === -1) {
    return res.status(404).json({ error: '评论不存在' });
  }

  const deletedComment = commentHistory.splice(index, 1)[0];

  // 通过 Socket.IO 广播删除事件给所有客户端
  io.emit('delete-comment', { commentId });

  console.log(`🗑️  评论已删除: ${deletedComment.username} - ${deletedComment.message}`);
  res.json({ success: true, commentId });
});

/**
 * API: 清空所有评论
 */
app.post('/clear-comments', (req, res) => {
  commentHistory = [];

  // 通过 Socket.IO 广播清空事件给所有客户端
  io.emit('clear-comments');

  console.log('🗑️  所有评论已清空');
  res.json({ success: true });
});

/**
 * API: 发送 SC（醒目留言）
 */
app.post('/send-sc', (req, res) => {
  const { username, message, amount, location } = req.body;

  if (!username || !message || !amount) {
    return res.status(400).json({ error: '昵称、内容和金额不能为空' });
  }

  const sc = {
    id: Date.now(),
    username: username.trim(),
    message: message.trim(),
    amount: parseFloat(amount),
    location: location ? location.trim() : '未知',
    timestamp: new Date().toISOString(),
    color: getSCColor(parseFloat(amount))
  };

  // 添加到活跃 SC 列表
  activeSCs.push(sc);

  // 通过 Socket.IO 广播新 SC 给所有客户端
  io.emit('new-sc', sc);

  console.log(`💰 新 SC: ${sc.username} - ¥${sc.amount}`);
  res.json({ success: true, sc });
});

/**
 * API: 撤下 SC
 */
app.post('/remove-sc', (req, res) => {
  const { scId } = req.body;

  if (!scId) {
    return res.status(400).json({ error: '请提供 SC ID' });
  }

  // 从活跃 SC 列表中删除
  const index = activeSCs.findIndex(sc => sc.id === scId);
  if (index === -1) {
    return res.status(404).json({ error: 'SC 不存在' });
  }

  const removedSC = activeSCs.splice(index, 1)[0];

  // 通过 Socket.IO 广播删除事件给所有客户端
  io.emit('remove-sc', { scId });

  console.log(`🗑️ SC 已撤下: ${removedSC.username} - ¥${removedSC.amount}`);
  res.json({ success: true, scId });
});

/**
 * API: 清空所有 SC
 */
app.post('/clear-scs', (req, res) => {
  activeSCs = [];

  // 通过 Socket.IO 广播清空事件给所有客户端
  io.emit('clear-scs');

  console.log('🗑️ 所有 SC 已清空');
  res.json({ success: true });
});

/**
 * 根据金额获取 SC 颜色等级
 */
function getSCColor(amount) {
  if (amount >= 100) return '#ff6b6b';  // 红色 - 高额
  if (amount >= 50) return '#ffa502';   // 橙色 - 中额
  if (amount >= 10) return '#2ed573';   // 绿色 - 普通
  return '#1e90ff';                      // 蓝色 - 小额
}

/**
 * Socket.IO 实时通信
 */
io.on('connection', (socket) => {
  console.log(`用户连接: ${socket.id}`);

  // 向新连接的用户发送当前自定义在线人数、最近的评论和活跃的 SC
  socket.emit('update-online-count', {
    targetCount: customOnlineCount,
    duration: 0  // 立即显示，无过渡
  });
  socket.emit('comment-history', commentHistory.slice(-10)); // 发送最近10条评论
  socket.emit('sc-list', activeSCs); // 发送当前活跃的 SC 列表

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
