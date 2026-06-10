---
title: 安装部署
sidebar_position: 3
---

# 安装部署

本章将指导你使用 Docker Compose 在本地环境成功部署 RAGFlow。部署过程简单直接，跟随步骤操作即可在数分钟内启动完整的 RAG 引擎服务。

---

## 硬件要求

在开始部署之前，请确保你的机器满足以下最低配置要求：

| 项目 | 最低要求 | 说明 |
|------|----------|------|
| CPU | ≥ 4 核 (x86) | 官方支持 x86 架构，ARM64 需自行构建镜像 |
| 内存 (RAM) | ≥ 16 GB | Elasticsearch 和模型加载需要较大内存 |
| 磁盘空间 | ≥ 50 GB | Docker 镜像解压后约占 7 GB，加上数据存储需预留空间 |
| Docker | ≥ 24.0.0 | 需同时安装 Docker Compose ≥ v2.26.1 |
| 操作系统 | Linux（推荐）/ macOS / Windows (WSL2) | Linux 环境部署最为顺畅 |

:::warning[⚠️ 注意]
RAGFlow 官方维护 x86 架构的 Docker 镜像。如果你使用 ARM 平台（如 Apple Silicon Mac），需要参考官方文档自行构建 Docker 镜像。
:::

---

## 环境检查

部署前，建议逐一检查环境是否满足要求：

### CPU 核数

```bash
# Linux
nproc

# macOS
sysctl -n hw.ncpu
```

### 内存大小

```bash
# Linux
free -h

# macOS
sysctl -n hw.memsize | awk '{print $1/1024/1024/1024 " GB"}'
```

### 磁盘空间

```bash
df -h
```

### Docker 版本

```bash
# 检查 Docker 版本（需 ≥ 24.0.0）
docker --version

# 检查 Docker Compose 版本（需 ≥ v2.26.1）
docker compose version
```

:::tip[💡 提示]
如果尚未安装 Docker，请参考 [Docker 官方安装指南](https://docs.docker.com/engine/install/) 完成安装。
:::

---

## 部署步骤

### 第一步：调整系统参数

确保 `vm.max_map_count` 值不低于 262144（Elasticsearch 运行要求）：

```bash
# 检查当前值
sysctl vm.max_map_count

# 如果值小于 262144，执行以下命令
sudo sysctl -w vm.max_map_count=262144
```

如需永久生效，将以下内容写入 `/etc/sysctl.conf`：

```bash
vm.max_map_count=262144
```

### 第二步：获取配置文件

从 GitHub 克隆 RAGFlow 仓库并切换到稳定版本：

```bash
git clone https://github.com/infiniflow/ragflow.git
cd ragflow/docker
git checkout -f v0.25.6
```

### 第三步：配置环境变量

RAGFlow 的 Docker Compose 配置位于 `docker/` 目录下。你可以通过编辑 `.env` 文件来自定义配置：

```bash
# 查看默认环境变量
cat .env
```

常用配置项包括：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `RAGFLOW_IMAGE` | RAGFlow 镜像版本 | `infiniflow/ragflow:v0.25.6` |
| `RAGFLOW_PORT` | 服务对外端口 | `80` |
| `MYSQL_PASSWORD` | MySQL 数据库密码 | 默认随机生成 |

### 第四步：启动服务

使用 Docker Compose 启动所有服务：

```bash
# 使用 CPU 模式部署（默认）
docker compose -f docker-compose.yml up -d
```

:::info[📝 说明]
首次启动时需要下载 Docker 镜像（压缩后约 2 GB），根据网络速度可能需要等待数分钟至数十分钟。
:::

### 第五步：确认服务状态

查看 RAGFlow 服务日志，等待启动完成：

```bash
docker logs -f docker-ragflow-cpu-1
```

当看到类似以下输出时，表示服务启动成功：

```
     ____   ___    ______ ______ __
    / __ \ /   |  / ____// ____// /____
   / /_/ // /| | / / __ / /_   / // __ \
  / _, _// ___ |/ /_/ // __/  / // /_/ /
 /_/ |_|/_/  |_|\____//_/    /_/ \____/

 * Running on all addresses (0.0.0.0)
```

---

## 部署验证

服务启动后，通过以下方式验证部署是否成功：

### 检查服务进程状态

```bash
docker compose ps
```

确认所有容器状态为 `running` 或 `healthy`：

```
NAME                       STATUS
docker-ragflow-cpu-1       Up (healthy)
docker-es-1                Up (healthy)
docker-mysql-1             Up (healthy)
docker-minio-1             Up (healthy)
docker-redis-1             Up (healthy)
```

### 浏览器访问系统界面

在浏览器中输入服务器地址访问 RAGFlow 界面：

```
http://你的服务器IP
```

:::tip[💡 提示]
使用默认配置时，HTTP 端口为 80，无需额外指定端口号。如果修改了 `RAGFLOW_PORT` 环境变量，则需要在地址后加上对应端口号，例如 `http://你的服务器IP:9380`。
:::

成功访问后，你将看到 RAGFlow 的登录/注册页面。注册一个账号即可开始使用。

<!-- ![部署成功截图](/img/ragflow/installation-success.webp){loading="lazy"} -->
<!-- 注意：部署成功后截图保存为 static/img/ragflow/installation-success.webp -->

---

## 常见问题排查

### 问题一：端口冲突

**错误现象：**

启动服务时报错，提示端口已被占用：

```
Error response from daemon: driver failed programming external connectivity
on endpoint: Bind for 0.0.0.0:80 failed: port is already allocated
```

**解决方案：**

1. 查找占用端口的进程：

```bash
# Linux/macOS
sudo lsof -i :80

# 或使用
sudo netstat -tlnp | grep :80
```

2. 停止占用端口的服务，或修改 RAGFlow 的端口配置：

```bash
# 编辑 .env 文件，修改端口
RAGFLOW_PORT=9380
```

3. 重新启动服务：

```bash
docker compose -f docker-compose.yml up -d
```

---

### 问题二：资源不足（OOM）

**错误现象：**

容器频繁重启，日志中出现 `Killed` 或 `OOMKilled` 错误：

```
docker-es-1 exited with code 137
```

或通过 `docker inspect` 查看到：

```json
"OOMKilled": true
```

**解决方案：**

1. 确认系统可用内存：

```bash
free -h
```

2. 如果物理内存不足 16 GB，考虑以下方案：

   - 增加系统内存（推荐）
   - 关闭其他占用内存的程序
   - 调整 Docker 内存限制（Docker Desktop 用户需在设置中增加分配内存）

3. 针对 Elasticsearch 内存问题，可尝试限制其堆内存：

```bash
# 在 docker-compose.yml 中为 es 服务添加环境变量
environment:
  - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
```

4. 重新启动服务：

```bash
docker compose -f docker-compose.yml down
docker compose -f docker-compose.yml up -d
```

---

### 问题三：镜像拉取失败

**错误现象：**

启动时报错，无法下载 Docker 镜像：

```
Error response from daemon: Get "https://registry-1.docker.io/v2/":
dial tcp: lookup registry-1.docker.io: no such host
```

或者下载速度极慢甚至超时。

**解决方案：**

1. 检查网络连接是否正常：

```bash
ping registry-1.docker.io
```

2. 配置 Docker 镜像加速器（中国大陆用户推荐）：

```bash
# 编辑 Docker daemon 配置
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
EOF

# 重启 Docker 服务
sudo systemctl daemon-reload
sudo systemctl restart docker
```

3. 重新拉取镜像并启动：

```bash
docker compose -f docker-compose.yml pull
docker compose -f docker-compose.yml up -d
```

:::tip[💡 提示]
如果你处于网络受限的环境，也可以考虑从可访问网络的机器导出镜像后离线导入：
```bash
# 导出镜像
docker save -o ragflow-images.tar infiniflow/ragflow:v0.25.6

# 在目标机器导入
docker load -i ragflow-images.tar
```
:::

---

## 下一步

部署成功后，继续阅读下一章「快速上手」，开始你的第一次 RAG 问答体验。
