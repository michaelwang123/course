---
title: zap
sidebar_position: 3
slug: /middleware/go-zap
---

# zap

## 简介与定位

Zap 是 Uber 开源的高性能结构化日志库（Structured Logging），在 Go 生态中以极低的内存分配（Allocation）和卓越的吞吐量著称。相比标准库 `log` 和 logrus，Zap 通过避免反射和减少堆分配实现了数倍性能提升，是对日志性能有要求的生产服务的首选。

## Go Module 引入方式

```bash
go get go.uber.org/zap@v1.27.0
```

## 核心用法与 API 速查

| API / 功能 | 用途说明 |
|------------|---------|
| `zap.NewProduction()` | 创建生产环境 Logger，输出 JSON 格式、Level≥Info |
| `zap.NewDevelopment()` | 创建开发环境 Logger，输出可读格式、Level≥Debug |
| `logger.Info() / Error()` | 输出对应级别的结构化日志，支持类型安全的字段 |
| `zap.String() / Int()` | 构造强类型日志字段，避免 `fmt.Sprintf` 的性能开销 |
| `logger.Sugar()` | 获取 SugaredLogger，提供 `printf` 风格的便捷 API（性能略低） |
| `logger.With()` | 创建携带预设字段的子 Logger，适合为请求链路注入 traceID |

## 实战代码示例

```go
package main

import (
	"go.uber.org/zap"
)

func main() {
	// 创建生产级 Logger，输出 JSON 格式日志便于 ELK 采集
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// 使用强类型字段记录结构化日志，避免字符串拼接开销
	logger.Info("服务启动成功",
		zap.String("addr", ":8080"),
		zap.Int("pid", 12345),
	)

	// 模拟错误场景，记录错误日志并附带上下文信息
	logger.Error("数据库连接失败",
		zap.String("dsn", "root:***@tcp(127.0.0.1:3306)/app"),
		zap.Int("retry", 3),
		zap.String("error", "connection refused"),
	)

	// 使用 Sugar 模式简化日志写法（适合非性能热点路径）
	sugar := logger.Sugar()
	sugar.Infof("当前用户数: %d", 1024)
}
```

## 使用心得与踩坑经验

Zap 提供两种 Logger：核心 `Logger`（强类型字段，零分配）和 `SugaredLogger`（printf 风格，略有分配）。性能关键路径务必使用核心 Logger，千万别图省事全局用 Sugar。另一个常见问题是 `logger.Sync()` 在程序退出时必须调用，否则缓冲区中的日志可能丢失。在 Linux 环境下对 stdout 调用 Sync 可能返回 `invalid argument` 错误，这是已知行为，可用 `_ = logger.Sync()` 忽略。生产环境建议通过 `zap.NewProductionConfig()` 自定义输出路径、日志切割等配置，配合 lumberjack 实现日志轮转。

## 适用场景建议

- 高 QPS 服务的请求日志记录（如网关、API 层）
- 需要结构化日志输出到 ELK / Loki 等日志平台的场景
- 微服务中需要注入 traceID、requestID 等链路追踪字段的日志系统

## 相关教程

- [cobra - CLI 框架](./cobra.md)
- [viper - 配置管理](./viper.md)
- [gin/echo - Web 框架](./gin-echo.md)
