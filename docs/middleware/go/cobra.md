---
title: cobra
sidebar_position: 1
slug: /middleware/go-cobra
---

# cobra

## 简介与定位

Cobra 是 Go 生态中最主流的 CLI（Command Line Interface，命令行界面）框架，由 spf13 开发并被 Kubernetes、Hugo、GitHub CLI 等知名项目采用。它提供了命令/子命令结构、自动生成帮助信息、Shell 补全等能力，是构建复杂命令行工具的事实标准。

## Go Module 引入方式

```bash
go get github.com/spf13/cobra@v1.8.1
```

## 核心用法与 API 速查

| API / 功能 | 用途说明 |
|------------|---------|
| `cobra.Command{}` | 定义一个命令，包含 Use（命令名）、Short/Long（说明）、Run（执行逻辑） |
| `cmd.AddCommand()` | 注册子命令，构建命令树结构 |
| `cmd.Flags().StringVarP()` | 为命令绑定字符串类型 Flag（标志参数），支持短标志 |
| `cmd.PersistentFlags()` | 定义可被子命令继承的全局 Flag |
| `cobra.OnInitialize()` | 注册初始化回调函数，在命令执行前运行（如加载配置） |

## 实战代码示例

```go
package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

// 定义根命令，所有子命令都挂载在此之下
var rootCmd = &cobra.Command{
	Use:   "myapp",
	Short: "myapp 是一个示例 CLI 工具",
}

// 定义 greet 子命令，演示 Flag 绑定与使用
var name string
var greetCmd = &cobra.Command{
	Use:   "greet",
	Short: "向指定用户打招呼",
	Run: func(cmd *cobra.Command, args []string) {
		// 从 Flag 中获取用户名并输出问候语
		fmt.Printf("你好, %s! 欢迎使用 myapp。\n", name)
	},
}

func init() {
	// 为 greet 命令添加 --name 参数，短标志为 -n
	greetCmd.Flags().StringVarP(&name, "name", "n", "World", "指定问候对象")
	rootCmd.AddCommand(greetCmd)
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
```

## 使用心得与踩坑经验

Cobra 的初始化顺序容易让人困惑：`PersistentPreRun` 和 `PreRun` 的执行时机不同，前者会被子命令继承执行，后者只在当前命令生效。建议配合 [viper](./viper.md) 一起使用时，将配置加载逻辑放在 `cobra.OnInitialize()` 中，而非 `init()` 函数里，否则可能在 Flag 解析完成之前就读取了配置，导致命令行参数无法覆盖配置文件中的同名字段。另外，Cobra 的自动补全功能默认需要执行 `completion` 子命令生成脚本，记得在文档中告知用户如何启用。

## 适用场景建议

- DevOps 工具、内部运维脚本的 CLI 入口
- 含多级子命令的复杂命令行应用（如 `kubectl get pods`）
- 需要自动生成 man page 或 Shell 补全的开源工具

## 相关教程

- [viper - 配置管理](./viper.md)
- [zap - 高性能日志](./zap.md)
- [gin/echo - Web 框架](./gin-echo.md)
