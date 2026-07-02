---
title: golangci-lint
sidebar_position: 3
slug: /middleware/go-golangci-lint
---

# golangci-lint

## 简介与定位

golangci-lint 是 Go 语言的静态分析（Static Analysis，不运行代码即检测潜在问题）聚合器，集成了 50+ 种 Linter（代码检查器）于一体。它通过并行执行和结果缓存实现极快的扫描速度，是 Go 项目 CI/CD 流水线中代码质量管控的事实标准工具。

## Go Module 引入方式

```bash
# 推荐使用 binary 安装（非 go install），避免依赖污染项目 go.mod
# macOS / Linux
curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin v1.59.1

# 或通过 go install（会写入 go.mod，仅推荐用于工具模块）
go install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.59.1
```

## 核心用法与 API 速查

| 命令 / 功能 | 用途说明 |
|------------|---------|
| `golangci-lint run` | 对当前项目执行全部已启用的 Linter 检查，输出问题列表 |
| `golangci-lint run --fix` | 自动修复支持 auto-fix 的 Linter 报告的问题（如 gofmt 格式化） |
| `golangci-lint linters` | 列出所有可用的 Linter 及其启用状态，便于了解检查范围 |
| `.golangci.yml` 配置文件 | 定义启用/禁用的 Linter、排除规则、严重级别等项目级配置 |
| `//nolint:lintername` 注释 | 在代码行级别抑制特定 Linter 的告警，需附带原因说明 |

## 实战代码示例

```go
package main

import (
	"fmt"
	"os"
)

// processFile 演示一个会被 golangci-lint 检测到问题的函数
// errcheck linter 会警告未处理 os.Remove 的返回错误
func processFile(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("读取文件失败: %w", err)
	}

	fmt.Printf("文件内容长度: %d\n", len(data))

	// 正确做法：处理可能的删除错误，满足 errcheck 检查要求
	if err := os.Remove(path); err != nil {
		return fmt.Errorf("删除临时文件失败: %w", err)
	}
	return nil
}

func main() {
	// 调用函数并检查错误，符合 golangci-lint 的 errcheck 规则
	if err := processFile("temp.txt"); err != nil {
		fmt.Fprintf(os.Stderr, "处理失败: %v\n", err)
		os.Exit(1)
	}
}
```

配合项目根目录的 `.golangci.yml` 配置：

```yaml
# .golangci.yml - 项目级 Linter 配置示例
linters:
  enable:
    - errcheck      # 检查未处理的错误返回值
    - govet         # 官方 vet 工具，检测可疑代码构造
    - staticcheck   # 综合静态分析，覆盖面广
    - unused        # 检测未使用的变量、函数和类型
  disable:
    - depguard      # 禁用依赖白名单检查（小项目不需要）

linters-settings:
  errcheck:
    check-type-assertions: true  # 同时检查类型断言是否处理了 ok 值

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - errcheck  # 测试文件中允许忽略错误返回值
```

## 使用心得与踩坑经验

golangci-lint 最常见的问题是初次引入时告警数量爆炸——建议先用 `--new-from-rev=main` 参数只检查增量代码，存量问题逐步修复。另一个坑是不同版本的 Linter 规则可能变化，团队必须在 CI 中锁定 golangci-lint 版本号，否则同一份代码在不同成员机器上检查结果不一致。`//nolint` 注释一定要写明原因（如 `//nolint:errcheck // 日志写入失败可忽略`），否则 `nolintlint` 检查器会反过来报警。

## 适用场景建议

- ✅ 团队协作项目的 CI 流水线，统一代码质量标准
- ✅ 代码审查前的自动化预检，减少人工 Review 中的低级问题
- ❌ 一次性脚本或原型验证代码，过早引入 lint 会拖慢迭代速度

## 相关教程

- [wire - 编译时依赖注入](./wire.md)
- [testify - 测试工具包](./testify.md)
