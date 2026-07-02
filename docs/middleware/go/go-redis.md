---
title: go-redis
sidebar_position: 4
slug: /middleware/go-go-redis
---

# go-redis

## 简介与定位

go-redis 是 Go 语言中功能最全面的 Redis 客户端库，支持 Redis 6/7 全部命令、集群（Cluster）模式、哨兵（Sentinel）模式、Pipeline 批量操作以及 Pub/Sub 消息订阅。它提供了类型安全的 API 设计和连接池管理，是 Go 项目中对接 Redis 的事实标准选择。

## Go Module 引入方式

```bash
go get -u github.com/redis/go-redis/v9@v9.5.1
```

## 核心用法与 API 速查

| API / 方法 | 用途说明 |
|------------|---------|
| `redis.NewClient(opt)` | 创建 Redis 单节点客户端连接 |
| `client.Set(ctx, key, value, exp)` | 设置键值对，支持过期时间 |
| `client.Get(ctx, key)` | 获取指定键的值 |
| `client.HSet(ctx, key, fields...)` | 设置 Hash 类型的字段值 |
| `client.LPush(ctx, key, values...)` | 向 List 左侧推入元素 |
| `client.Pipeline()` | 创建 Pipeline 批量执行命令，减少网络往返 |
| `client.Subscribe(ctx, channels...)` | 订阅消息通道，接收 Pub/Sub 消息 |

## 实战代码示例

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()

	// 创建 Redis 客户端，配置连接池大小和超时参数
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
		PoolSize: 10,
	})

	// 测试连接是否正常
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatal("Redis 连接失败:", err)
	}

	// 设置键值对，过期时间 5 分钟，适用于缓存场景
	err := rdb.Set(ctx, "user:1:name", "张三", 5*time.Minute).Err()
	if err != nil {
		log.Fatal(err)
	}

	// 读取缓存值并打印
	name, err := rdb.Get(ctx, "user:1:name").Result()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("用户名:", name)

	// 使用 Pipeline 批量操作，一次网络往返执行多条命令
	pipe := rdb.Pipeline()
	pipe.HSet(ctx, "user:1:profile", "age", 28, "city", "北京")
	pipe.Expire(ctx, "user:1:profile", 10*time.Minute)
	_, err = pipe.Exec(ctx)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Pipeline 批量写入完成")
}
```

## 使用心得与踩坑经验

使用 go-redis 最重要的一点是正确配置连接池参数——默认 `PoolSize` 为 10，在高并发场景下容易出现 `connection pool exhausted` 错误。建议根据业务 QPS 和 Redis 命令平均耗时计算合理的连接池大小，一般设置为并发数的 1.5 倍。另一个常见问题是忘记处理 `redis.Nil` 错误：当 key 不存在时 `Get` 返回的 error 是 `redis.Nil` 而不是普通 error，需要用 `errors.Is(err, redis.Nil)` 判断，否则会误判为连接异常。

关于 Redis 的完整架构原理、部署方式及生产环境最佳实践，请参考 [Redis 中间件教程](../middleware/redis)。

## 适用场景建议

- ✅ Web 应用的会话缓存（Session）、接口限流、分布式锁等
- ✅ 需要 Pipeline 或 Lua 脚本（Script）的高性能批量操作场景
- ❌ 仅需简单的本地缓存，无需 Redis 服务时，建议使用 `sync.Map` 或 `bigcache`

## 相关教程

- [gorm - ORM 框架](./gorm.md)
- [samber/lo - 泛型工具函数库](./samber-lo.md)
- [gjson/sjson - JSON 路径读写](./gjson-sjson.md)
