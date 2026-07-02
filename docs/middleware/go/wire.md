---
title: wire
sidebar_position: 1
slug: /middleware/go-wire
---

# Wire

## 简介与定位

Wire 是 Google 开源的 Go 语言编译时依赖注入（Dependency Injection，通过外部提供依赖而非内部创建）代码生成工具。与运行时反射注入不同，Wire 在编译阶段通过静态分析生成依赖组装代码，既保证了类型安全，又避免了运行时开销。适合中大型 Go 项目的依赖管理与模块解耦。

## Go Module 引入方式

```bash
# 安装 wire 命令行工具
go install github.com/google/wire/cmd/wire@v0.6.0

# 在项目中引入 wire 运行时依赖
go get github.com/google/wire@v0.6.0
```

## 核心用法与 API 速查

| API / 功能 | 用途说明 |
|------------|---------|
| `wire.NewSet()` | 将多个 Provider（提供者函数）组合为一个 ProviderSet，便于模块化管理依赖 |
| `wire.Build()` | 在 Injector 函数中声明需要组装的依赖集合，Wire 据此生成完整的初始化代码 |
| `wire.Bind()` | 将接口绑定到具体实现类型，实现面向接口编程的依赖注入 |
| `wire.Struct()` | 自动为结构体的指定字段注入依赖，减少手写赋值代码 |
| `wire.Value()` | 将固定值作为 Provider 提供给依赖图，适用于配置常量注入 |

## 实战代码示例

```go
// +build wireinject

package main

import (
	"fmt"

	"github.com/google/wire"
)

// Message 是一个简单的依赖类型
type Message string

// Greeter 依赖 Message 来生成问候语
type Greeter struct {
	Message Message
}

// NewMessage 提供 Message 实例，作为依赖图的叶子节点
func NewMessage() Message {
	return Message("你好，Wire!")
}

// NewGreeter 构造 Greeter，声明对 Message 的依赖关系
func NewGreeter(m Message) *Greeter {
	return &Greeter{Message: m}
}

// Greet 输出问候内容
func (g *Greeter) Greet() string {
	return fmt.Sprintf("问候: %s", g.Message)
}

// InitializeGreeter 是 Wire 的 Injector 函数，编译时自动生成实现代码
func InitializeGreeter() *Greeter {
	// wire.Build 声明本次注入需要用到的全部 Provider
	wire.Build(NewMessage, NewGreeter)
	return nil // 返回值由 Wire 生成的代码填充
}

func main() {
	// 调用生成的注入函数获取完整组装好的对象
	greeter := InitializeGreeter()
	fmt.Println(greeter.Greet())
}
```

## 使用心得与踩坑经验

Wire 的核心优势在于"编译时确定依赖关系"，如果依赖图有缺失或循环，在 `wire` 命令执行时就会报错，而不是等到运行时才崩溃。踩坑点：Injector 文件必须加 `//go:build wireinject` 构建标签，否则会与生成的 `wire_gen.go` 产生符号冲突导致编译失败。另外，ProviderSet 的组合顺序不影响结果，但同一类型不能有两个 Provider，否则 Wire 会报"多重绑定"错误。

## 适用场景建议

- ✅ 中大型项目中服务层、仓储层、控制器层的依赖组装
- ✅ 需要面向接口编程并灵活替换实现的场景（如测试替身注入）
- ❌ 小型脚本或依赖关系极简的工具类项目，手动 `new` 更直接

## 相关教程

- [testify - 测试工具包](./testify.md)
- [golangci-lint - 静态分析聚合器](./golangci-lint.md)
