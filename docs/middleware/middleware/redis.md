---
title: Redis
sidebar_position: 1
slug: /middleware/redis
---

# Redis

## 简介与定位

Redis（Remote Dictionary Server，远程字典服务）是一款开源的高性能内存数据结构存储系统，支持 String、Hash、List、Set、Sorted Set 等多种数据结构。在微服务架构中，Redis 承担着**分布式缓存层**和**共享数据存储**的核心角色，是服务间数据共享与性能优化的关键基础设施。

**典型使用场景：**

1. **分布式会话与缓存加速**：将高频读取的数据（如用户会话、热门商品信息）缓存至 Redis，减少数据库访问压力，接口响应时间可从 50ms 降至 5ms 以内。
2. **分布式锁与限流**：利用 Redis 的原子操作实现跨服务的分布式锁和接口限流（Rate Limiting），保障高并发场景下的数据一致性和系统稳定性。

## 架构原理图解

```
┌─────────────────────────────────────────────────┐
│                  客户端应用层                      │
│         (Jedis / Lettuce / go-redis)            │
└─────────────────────┬───────────────────────────┘
                      │ TCP 连接（默认端口 6379）
                      ▼
┌─────────────────────────────────────────────────┐
│              Redis Cluster 集群模式               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Master-1 │  │ Master-2 │  │ Master-3 │     │
│  │ Slot 0-  │  │ Slot     │  │ Slot     │     │
│  │   5460   │  │5461-10922│  │10923-16383│    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │              │              │           │
│  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐     │
│  │ Replica-1│  │ Replica-2│  │ Replica-3│     │
│  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│               持久化层 (RDB / AOF)               │
└─────────────────────────────────────────────────┘
```

**集群模式说明**：Redis Cluster 将 16384 个哈希槽（Hash Slot）分配到多个 Master 节点，每个 Master 可配备 Replica 节点实现高可用。客户端通过 CRC16 算法计算 Key 所属的 Slot，自动路由到对应节点。

## 部署方式

### Docker Compose 单机部署

```yaml
version: "3.8"
services:
  redis:
    image: redis:7.2-alpine
    container_name: redis-server
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass mypassword
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "mypassword", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  redis_data:
```

### 就绪验证命令

```bash
# 检查 Redis 是否正常响应
docker exec redis-server redis-cli -a mypassword ping
# 预期输出: PONG

# 查看 Redis 服务信息
docker exec redis-server redis-cli -a mypassword info server | head -10
```

## 核心概念与术语

| 术语 | 说明 |
|------|------|
| String（字符串） | 最基础的数据类型，可存储文本、数字或二进制数据，最大 512MB，常用于缓存和计数器 |
| Hash（哈希表） | 键值对集合，适合存储对象属性（如用户信息），支持对单个字段的读写操作 |
| List（列表） | 有序字符串链表，支持头尾插入/弹出，适用于消息队列和时间线场景 |
| Set（集合） | 无序不重复字符串集合，支持交集、并集、差集运算，适用于标签和好友关系 |
| Sorted Set（有序集合） | 每个元素关联一个分数（Score），按分数排序，适用于排行榜和延迟队列 |
| TTL（Time To Live） | 键的过期时间，到期后 Redis 自动删除，是缓存策略的核心机制 |
| Slot（哈希槽） | Redis Cluster 的数据分片单位，共 16384 个，决定 Key 存储在哪个节点 |
| AOF（Append Only File） | 追加式持久化日志，记录每次写操作，数据安全性高于 RDB 快照方式 |

## Java/Go 客户端接入示例

### Java 接入（Spring Boot + Lettuce）

```java
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class RedisCacheService {
    private final StringRedisTemplate redisTemplate;

    public RedisCacheService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // 缓存用户信息，设置 30 分钟过期时间
    public void cacheUser(String userId, String userJson) {
        redisTemplate.opsForValue().set(
            "user:" + userId, userJson, 30, TimeUnit.MINUTES
        );
    }

    // 从缓存获取用户信息，未命中返回 null
    public String getUser(String userId) {
        return redisTemplate.opsForValue().get("user:" + userId);
    }

    // 使用 Hash 结构存储对象的多个属性字段
    public void setUserField(String userId, String field, String value) {
        redisTemplate.opsForHash().put("user:detail:" + userId, field, value);
    }
}
```

### Go 接入（go-redis）

```go
package main

import (
    "context"
    "fmt"
    "time"

    "github.com/redis/go-redis/v9"
)

func main() {
    ctx := context.Background()

    // 初始化 Redis 客户端连接，配置连接池参数
    rdb := redis.NewClient(&redis.Options{
        Addr:     "localhost:6379",
        Password: "mypassword",
        DB:       0,
        PoolSize: 10, // 连接池大小，生产环境根据并发量调整
    })

    // 设置缓存并指定过期时间，适用于会话管理场景
    err := rdb.Set(ctx, "session:abc123", "user_data_json", 30*time.Minute).Err()
    if err != nil {
        panic(err)
    }

    // 读取缓存值
    val, err := rdb.Get(ctx, "session:abc123").Result()
    if err != nil {
        panic(err)
    }
    fmt.Println("缓存值:", val)
}
```

## 生产环境注意事项

- **内存管理**：设置 `maxmemory` 和淘汰策略（如 `allkeys-lru`），防止内存溢出导致 OOM（Out Of Memory）。建议预留 30% 内存给 RDB/AOF 持久化的 fork 操作。
- **持久化策略选择**：RDB 适合冷备份（恢复快），AOF 适合数据安全性要求高的场景。生产环境推荐 AOF + RDB 混合持久化模式，兼顾恢复速度和数据完整性。
- **连接池与超时配置**：客户端务必使用连接池（Pool），设置合理的连接超时（ConnectTimeout）和读写超时（ReadTimeout），避免网络抖动导致线程长时间阻塞。Lettuce 默认 60 秒超时过长，建议设为 3-5 秒。

## 常见问题与排查经验

### Q1: 缓存穿透——大量请求查询不存在的 Key 导致数据库被打垮

**现象**：Redis 命中率骤降，数据库 QPS 异常升高。

**排查步骤**：
1. 使用 `redis-cli monitor` 观察请求模式，确认是否为恶意请求
2. 检查缓存 Key 是否对不存在的数据也做了缓存（空值缓存策略）
3. 引入布隆过滤器（Bloom Filter）在 Redis 层前置拦截不存在的 Key

### Q2: Redis 内存持续增长，设置了过期时间但内存不降

**现象**：通过 `INFO memory` 查看 `used_memory` 持续上涨。

**排查步骤**：
1. 使用 `redis-cli --bigkeys` 扫描大 Key，定位内存占用热点
2. 检查是否存在未设置 TTL 的 Key（`OBJECT IDLETIME key` 查看空闲时长）
3. 确认淘汰策略是否正确配置，使用 `CONFIG GET maxmemory-policy` 验证

### Q3: 集群模式下出现 MOVED/ASK 重定向错误

**现象**：客户端报 `MOVED 12345 192.168.1.2:6379` 错误。

**排查步骤**：
1. 确认客户端使用了集群模式连接（如 `RedisClusterClient` 而非 `RedisClient`）
2. 执行 `CLUSTER INFO` 检查集群状态是否为 `cluster_state:ok`
3. 执行 `CLUSTER NODES` 确认 Slot 分配是否均衡，是否有节点处于 `fail` 状态

---

## 相关教程

- [Apache Kafka - 分布式消息队列](./kafka.md)
- [Nacos - 服务发现与配置中心](./nacos.md)
