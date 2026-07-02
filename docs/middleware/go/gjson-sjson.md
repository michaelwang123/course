---
title: gjson/sjson
sidebar_position: 3
slug: /middleware/go-gjson-sjson
---

# gjson/sjson

## 简介与定位

gjson 和 sjson 是一对轻量级 JSON 处理库：gjson 用于通过路径语法（Path Syntax）快速读取 JSON 字段值，sjson 则用于通过路径设置或修改 JSON 字段值。两者无需将 JSON 反序列化为结构体即可完成读写操作，特别适合处理动态结构或只需提取部分字段的场景。

## Go Module 引入方式

```bash
go get -u github.com/tidwall/gjson@v1.17.1
go get -u github.com/tidwall/sjson@v1.2.5
```

## 核心用法与 API 速查

| API / 函数 | 用途说明 |
|------------|---------|
| `gjson.Get(json, path)` | 通过路径表达式读取 JSON 中的指定字段值 |
| `gjson.GetMany(json, paths...)` | 一次性读取多个路径的值，减少重复解析 |
| `result.String()` / `.Int()` / `.Bool()` | 将 gjson 查询结果转为 Go 基本类型 |
| `result.Array()` | 获取数组类型结果，返回 `[]Result` 切片 |
| `sjson.Set(json, path, value)` | 在 JSON 字符串中设置指定路径的值 |
| `sjson.Delete(json, path)` | 删除 JSON 字符串中指定路径的字段 |
| `gjson.Valid(json)` | 校验字符串是否为合法 JSON 格式 |

## 实战代码示例

```go
package main

import (
	"fmt"

	"github.com/tidwall/gjson"
	"github.com/tidwall/sjson"
)

func main() {
	// 模拟从 API 返回的嵌套 JSON 数据
	json := `{
		"name": "张三",
		"age": 30,
		"address": {"city": "北京", "district": "海淀区"},
		"skills": ["Go", "Rust", "Python"]
	}`

	// 使用路径语法直接读取嵌套字段，无需定义结构体
	city := gjson.Get(json, "address.city")
	fmt.Println("城市:", city.String())

	// 读取数组中的指定索引元素
	firstSkill := gjson.Get(json, "skills.0")
	fmt.Println("第一技能:", firstSkill.String())

	// 使用 sjson 动态修改 JSON 字段值，返回新的 JSON 字符串
	updated, _ := sjson.Set(json, "age", 31)
	updated, _ = sjson.Set(updated, "address.district", "朝阳区")
	fmt.Println("更新后年龄:", gjson.Get(updated, "age").Int())
	fmt.Println("更新后区域:", gjson.Get(updated, "address.district").String())

	// 删除指定字段
	deleted, _ := sjson.Delete(updated, "skills")
	fmt.Println("删除 skills 后:", deleted)
}
```

## 使用心得与踩坑经验

gjson/sjson 最大的优势是在不定义结构体的情况下快速操作 JSON，但要注意它们是基于字符串操作的，每次 `sjson.Set` 都会生成一份新的 JSON 字符串。如果需要对同一份 JSON 做大量修改，频繁调用 sjson 会有性能损耗和内存分配开销，此时应考虑先反序列化为 `map` 或结构体，修改完后再序列化。另外，gjson 的路径语法支持通配符和条件过滤（如 `skills.#(=="Go")`），功能强大但容易写错，建议先在测试中验证路径表达式是否正确。

## 适用场景建议

- ✅ 从大型 JSON 中提取少量字段（如日志解析、Webhook 回调处理）
- ✅ 动态 JSON 结构场景，无法提前定义结构体时的临时读写
- ❌ 需要完整序列化/反序列化的业务对象处理，建议使用 `encoding/json` 或 gorm 模型

## 相关教程

- [gorm - ORM 框架](./gorm.md)
- [samber/lo - 泛型工具函数库](./samber-lo.md)
- [go-redis - Redis 客户端](./go-redis.md)
