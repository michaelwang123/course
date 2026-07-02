---
title: gorm
sidebar_position: 1
slug: /middleware/go-gorm
---

# gorm

## 简介与定位

gorm 是 Go 语言中最流行的 ORM（Object-Relational Mapping，对象关系映射）框架，由 jinzhu 开发并维护。它提供了全功能的 ORM 能力，包括模型关联、事务、迁移、钩子等，API 设计简洁且支持链式调用，是 Go 后端项目中数据库操作的首选方案。

## Go Module 引入方式

```bash
go get -u gorm.io/gorm@v1.25.10
go get -u gorm.io/driver/mysql@v1.5.7
```

## 核心用法与 API 速查

| API / 方法 | 用途说明 |
|------------|---------|
| `db.AutoMigrate(&Model{})` | 根据结构体自动创建或更新数据库表结构 |
| `db.Create(&record)` | 插入一条新记录到数据库 |
| `db.First(&result, id)` | 根据主键查询单条记录 |
| `db.Where("name = ?", n).Find(&list)` | 条件查询多条记录 |
| `db.Model(&record).Updates(map)` | 更新指定字段 |
| `db.Delete(&record, id)` | 根据主键删除记录（支持软删除） |
| `db.Transaction(func(tx) error)` | 在事务中执行多个操作 |

## 实战代码示例

```go
package main

import (
	"fmt"
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// User 定义用户模型，gorm.Model 内嵌了 ID、CreatedAt、UpdatedAt、DeletedAt 字段
type User struct {
	gorm.Model
	Name  string `gorm:"size:100;not null"`
	Email string `gorm:"uniqueIndex;size:200"`
	Age   int
}

func main() {
	// 连接 MySQL 数据库，使用 DSN 格式配置连接参数
	dsn := "root:password@tcp(127.0.0.1:3306)/testdb?charset=utf8mb4&parseTime=True"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("数据库连接失败:", err)
	}

	// 自动迁移表结构，开发环境使用非常方便
	db.AutoMigrate(&User{})

	// 创建记录
	user := User{Name: "张三", Email: "zhangsan@example.com", Age: 28}
	db.Create(&user)

	// 条件查询并打印结果
	var result User
	db.Where("name = ?", "张三").First(&result)
	fmt.Printf("查询结果: %s, 年龄: %d\n", result.Name, result.Age)
}
```

## 使用心得与踩坑经验

使用 gorm 最常见的坑是查询条件中零值被忽略的问题——当用结构体作为查询条件时，`int` 类型的 0 和 `string` 类型的空字符串会被 gorm 自动忽略，导致查询结果不符合预期。解决方案是使用 `map[string]interface{}` 或 `Where` 子句代替结构体条件。另外，生产环境务必关闭 `AutoMigrate`，改用版本化的数据库迁移工具如 golang-migrate，避免自动变更表结构引发线上事故。

## 适用场景建议

- ✅ CRUD 密集的后台管理系统和 Web API 服务
- ✅ 需要快速迭代的中小型项目，利用 AutoMigrate 加速开发
- ❌ 对 SQL 执行性能有极致要求的场景，建议直接使用 `sqlx` 或原生 `database/sql`

## 相关教程

- [samber/lo - 泛型工具函数库](./samber-lo.md)
- [gjson/sjson - JSON 路径读写](./gjson-sjson.md)
- [go-redis - Redis 客户端](./go-redis.md)
