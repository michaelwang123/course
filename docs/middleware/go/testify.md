---
title: testify
sidebar_position: 2
slug: /middleware/go-testify
---

# Testify

## 简介与定位

Testify 是 Go 生态中最流行的测试辅助工具包，提供丰富的断言（Assertion，判断实际值是否符合预期）函数和 Mock（模拟对象）能力。它基于标准 `testing` 包扩展，无需更换测试运行器，降低了引入成本。适合需要可读性强的断言语法和接口 Mock 的 Go 项目。

## Go Module 引入方式

```bash
go get github.com/stretchr/testify@v1.9.0
```

## 核心用法与 API 速查

| API / 功能 | 用途说明 |
|------------|---------|
| `assert.Equal(t, expected, actual)` | 判断两个值是否相等，失败时输出可读的 diff 信息但继续执行 |
| `assert.NoError(t, err)` | 断言 error 为 nil，常用于函数返回值检查 |
| `assert.Contains(t, str, substr)` | 断言字符串或切片中包含指定元素 |
| `require.Equal(t, expected, actual)` | 与 assert 类似但失败后立即终止当前测试，适用于前置条件校验 |
| `mock.Mock` | 嵌入结构体实现接口 Mock，可设置期望调用与返回值 |
| `suite.Suite` | 提供 SetupTest/TearDownTest 生命周期钩子，组织测试套件 |

## 实战代码示例

```go
package user_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// UserRepository 定义用户仓储接口
type UserRepository interface {
	FindByID(id int) (string, error)
}

// MockUserRepo 是 UserRepository 的模拟实现，用于隔离外部依赖
type MockUserRepo struct {
	mock.Mock
}

// FindByID 模拟方法，返回预设的调用结果
func (m *MockUserRepo) FindByID(id int) (string, error) {
	args := m.Called(id)
	return args.String(0), args.Error(1)
}

func TestGetUserName(t *testing.T) {
	// 创建 Mock 对象并设置期望：当传入 id=1 时返回 "张三"
	repo := new(MockUserRepo)
	repo.On("FindByID", 1).Return("张三", nil)

	// 调用被测逻辑，验证返回值符合预期
	name, err := repo.FindByID(1)
	assert.NoError(t, err)
	assert.Equal(t, "张三", name)

	// 验证 Mock 期望的方法确实被调用
	repo.AssertExpectations(t)
}
```

## 使用心得与踩坑经验

使用 testify 最大的收益是测试失败时的错误信息极为清晰——`assert.Equal` 会输出 expected 和 actual 的完整 diff，比标准库 `t.Errorf` 手写格式化高效很多。踩坑点：`assert` 和 `require` 的区别务必理清——`assert` 失败后测试继续执行（适合多项检查），`require` 失败后立即 `t.FailNow()`（适合前置条件）。混用会导致后续断言在无效状态下执行产生误导性报错。

## 适用场景建议

- ✅ 业务逻辑单元测试，需要清晰断言和详细失败报告
- ✅ 依赖外部服务（数据库、HTTP API）的代码，通过 Mock 隔离测试
- ❌ 性能基准测试（benchmark），应直接使用标准库 `testing.B`

## 相关教程

- [wire - 编译时依赖注入](./wire.md)
- [golangci-lint - 静态分析聚合器](./golangci-lint.md)
