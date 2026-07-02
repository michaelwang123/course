---
title: viper
sidebar_position: 2
slug: /middleware/go-viper
---

# viper

## 简介与定位

Viper 是 Go 生态中功能最全面的配置管理库，支持从 JSON、YAML、TOML、环境变量、命令行 Flag 等多种来源读取配置，并提供配置热更新（Hot Reload）能力。它与 [cobra](./cobra.md) 同属 spf13 系列，天然集成，是 Go 服务配置管理的首选方案。

## Go Module 引入方式

```bash
go get github.com/spf13/viper@v1.19.0
```

## 核心用法与 API 速查

| API / 功能 | 用途说明 |
|------------|---------|
| `viper.SetConfigFile()` | 指定配置文件路径（含扩展名） |
| `viper.ReadInConfig()` | 从指定配置文件读取并解析配置 |
| `viper.GetString() / GetInt()` | 按 key 获取对应类型的配置值 |
| `viper.SetDefault()` | 设置配置项的默认值，当无其他来源提供时生效 |
| `viper.AutomaticEnv()` | 自动绑定环境变量，key 名称自动转大写并替换 `.` 为 `_` |
| `viper.WatchConfig()` | 监听配置文件变化并触发回调，实现热更新 |

## 实战代码示例

```go
package main

import (
	"fmt"
	"log"

	"github.com/spf13/viper"
)

func main() {
	// 设置默认值，确保缺少配置时程序也能正常运行
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("server.host", "0.0.0.0")

	// 指定配置文件名和搜索路径
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./configs")

	// 绑定环境变量，环境变量优先级高于配置文件
	viper.AutomaticEnv()

	// 尝试读取配置文件（文件不存在时使用默认值）
	if err := viper.ReadInConfig(); err != nil {
		log.Printf("未找到配置文件，使用默认值: %v", err)
	}

	// 读取配置并使用
	host := viper.GetString("server.host")
	port := viper.GetInt("server.port")
	fmt.Printf("服务启动地址: %s:%d\n", host, port)

	// 监听配置变化，支持运行时热更新
	viper.WatchConfig()
	fmt.Println("配置热更新已启用")
}
```

## 使用心得与踩坑经验

Viper 的配置优先级（由高到低）为：显式 Set > Flag > 环境变量 > 配置文件 > 默认值。实际项目中最常见的坑是环境变量绑定——`viper.AutomaticEnv()` 要求环境变量名必须全大写，且嵌套 key 中的 `.` 会被替换为 `_`（如 `server.port` 对应 `SERVER_PORT`）。如果使用了自定义前缀 `viper.SetEnvPrefix("APP")`，则变量名变为 `APP_SERVER_PORT`。建议在项目初期就明确配置层级命名规范，避免后期在多环境部署时因命名不一致导致配置加载失败。

## 适用场景建议

- 微服务的多环境配置管理（dev / staging / prod）
- 需要从环境变量、配置文件、远程配置中心多源加载配置的场景
- 配合 [cobra](./cobra.md) 实现 CLI 工具的参数 + 配置文件混合管理

## 相关教程

- [cobra - CLI 框架](./cobra.md)
- [zap - 高性能日志](./zap.md)
- [gin/echo - Web 框架](./gin-echo.md)
