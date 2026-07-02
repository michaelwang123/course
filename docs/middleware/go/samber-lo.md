---
title: samber/lo
sidebar_position: 2
slug: /middleware/go-samber-lo
---

# samber/lo

## 简介与定位

samber/lo 是一个基于 Go 1.18+ 泛型（Generics）实现的实用工具函数库，灵感来自 JavaScript 的 Lodash。它提供了丰富的集合操作、条件判断、类型转换等工具函数，让 Go 代码更加简洁优雅，避免重复编写样板循环代码。

## Go Module 引入方式

```bash
go get -u github.com/samber/lo@v1.39.0
```

## 核心用法与 API 速查

| API / 函数 | 用途说明 |
|------------|---------|
| `lo.Map(slice, func)` | 对切片每个元素执行映射转换，返回新切片 |
| `lo.Filter(slice, func)` | 过滤切片中满足条件的元素 |
| `lo.Find(slice, func)` | 查找切片中第一个满足条件的元素 |
| `lo.Uniq(slice)` | 去除切片中的重复元素 |
| `lo.GroupBy(slice, func)` | 按条件将切片元素分组为 map |
| `lo.Contains(slice, elem)` | 判断切片是否包含指定元素 |
| `lo.Chunk(slice, size)` | 将切片按指定大小分块 |

## 实战代码示例

```go
package main

import (
	"fmt"
	"strings"

	"github.com/samber/lo"
)

type Product struct {
	Name     string
	Price    float64
	Category string
}

func main() {
	products := []Product{
		{Name: "键盘", Price: 299, Category: "外设"},
		{Name: "鼠标", Price: 149, Category: "外设"},
		{Name: "显示器", Price: 2499, Category: "显示"},
		{Name: "耳机", Price: 599, Category: "音频"},
		{Name: "摄像头", Price: 399, Category: "外设"},
	}

	// 筛选价格大于 200 的商品，无需手写 for 循环
	expensive := lo.Filter(products, func(p Product, _ int) bool {
		return p.Price > 200
	})

	// 将商品名称提取为字符串切片，泛型让类型转换一目了然
	names := lo.Map(expensive, func(p Product, _ int) string {
		return p.Name
	})

	fmt.Println("高价商品:", strings.Join(names, ", "))

	// 按分类分组，返回 map[string][]Product
	grouped := lo.GroupBy(products, func(p Product) string {
		return p.Category
	})

	for category, items := range grouped {
		fmt.Printf("分类[%s]: %d 件商品\n", category, len(items))
	}
}
```

## 使用心得与踩坑经验

samber/lo 极大提升了集合操作的可读性，但需注意性能取舍：每次调用 `lo.Map` 或 `lo.Filter` 都会分配新的切片内存，在高频热路径（如每秒万次以上调用的循环内）中使用可能增加 GC 压力。此时建议回退到原生 for 循环并复用缓冲区。另一个常见困惑是回调函数的第二个参数 `index int` 即使不使用也必须声明，这是 Go 函数签名的要求。

## 适用场景建议

- ✅ 数据转换、过滤、分组等集合操作密集的业务逻辑层
- ✅ 替代重复的 for-range 模式代码，提升可读性和开发效率
- ❌ 性能极端敏感的热路径代码，如网络包解析或高频交易引擎

## 相关教程

- [gorm - ORM 框架](./gorm.md)
- [gjson/sjson - JSON 路径读写](./gjson-sjson.md)
- [go-redis - Redis 客户端](./go-redis.md)
