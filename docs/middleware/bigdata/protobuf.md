---
title: Protocol Buffers
sidebar_position: 2
slug: /middleware/bigdata-protobuf
---

# Protocol Buffers

## 简介与定位

Protocol Buffers（简称 Protobuf）是 Google 开源的跨语言、跨平台的结构化数据序列化协议。通过 `.proto` 文件定义数据结构，由编译器自动生成多种语言（Java、Go、Python、C++ 等）的序列化/反序列化代码。Protobuf 以紧凑的二进制编码实现高性能数据交换，广泛应用于 RPC 框架（gRPC）和大数据系统间通信。适用数据规模：**GB-TB 级**。

## 依赖引入方式

```xml
<!-- Maven 引入 Protobuf Java 运行时 -->
<dependency>
    <groupId>com.google.protobuf</groupId>
    <artifactId>protobuf-java</artifactId>
    <version>4.26.1</version>
</dependency>
```

```bash
# Go: 安装 protoc 编译器和 Go 插件
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
```

## 核心概念与架构说明

Protobuf 的工作流程为：定义 `.proto` Schema 文件 → `protoc` 编译器生成目标语言代码 → 应用代码调用生成的 Builder/Message API 进行序列化和反序列化。每个字段通过唯一的 field number（字段编号）标识，支持向前/向后兼容的 Schema 演进。编码采用 Varint（可变长整数）和 Length-Delimited（长度前缀）格式，数据体积通常比 JSON 小 3-10 倍，解析速度快 5-20 倍。

## 实战代码示例

### 示例一：Java 序列化与反序列化

假设已定义 `user.proto`:
```protobuf
syntax = "proto3";
message User {
  string name = 1;
  int32 age = 2;
  repeated string tags = 3;
}
```

```java
import com.example.proto.UserProto.User;

public class ProtobufJavaDemo {
    public static void main(String[] args) throws Exception {
        // 使用 Builder 模式构建 Protobuf 消息对象
        User user = User.newBuilder()
                .setName("张三")
                .setAge(28)
                .addTags("developer")
                .addTags("java")
                .build();

        // 序列化为二进制字节数组，体积远小于 JSON 表示
        byte[] bytes = user.toByteArray();
        System.out.println("序列化大小: " + bytes.length + " bytes");

        // 从字节数组反序列化，类型安全且无需手动解析字段
        User parsed = User.parseFrom(bytes);
        System.out.println("姓名: " + parsed.getName() + ", 年龄: " + parsed.getAge());
    }
}
```

### 示例二：Go 序列化（含性能对比）

```go
package main

import (
	"fmt"
	"google.golang.org/protobuf/proto"
	pb "myproject/proto/user"
)

func main() {
	// 构造 Protobuf 消息，Go 直接使用结构体赋值
	user := &pb.User{
		Name: "李四",
		Age:  30,
		Tags: []string{"golang", "backend"},
	}

	// 序列化为二进制，性能对比：同结构数据 Protobuf 约 45 bytes，JSON 约 120 bytes
	data, err := proto.Marshal(user)
	if err != nil {
		panic(err)
	}
	fmt.Printf("序列化大小: %d bytes\n", len(data))

	// 反序列化还原对象，解析速度比 JSON 快 5-10 倍
	var parsed pb.User
	proto.Unmarshal(data, &parsed)
	fmt.Printf("姓名: %s, 标签: %v\n", parsed.Name, parsed.Tags)
}
```

> **性能对比说明**：在相同数据结构的序列化测试中，Protobuf 二进制体积约为 JSON 的 30-40%，序列化速度约为 JSON 的 5 倍，反序列化速度约为 JSON 的 8 倍。在高吞吐 RPC 场景下优势尤为明显。

## 大数据场景下的最佳实践

- **RPC 通信首选 Protobuf + gRPC**：gRPC 天然集成 Protobuf，提供代码生成、流式传输和连接复用能力，比 REST + JSON 方案在吞吐和延迟上有显著优势
- **字段编号只增不改**：发布后的 `.proto` 文件中已使用的 field number 不可复用或修改类型，否则会导致新旧版本数据不兼容

## 使用心得与踩坑经验

- Proto3 中所有字段默认值为零值（空串/0/false），无法区分"未设置"和"设置为默认值"；需要此语义时使用 `optional` 关键字或 wrapper types
- `protoc` 编译器版本需与运行时库版本匹配，版本不一致会导致生成代码编译失败，建议用 buf 工具统一管理

## 相关教程

- [Avro/Parquet - 大数据存储格式](./avro-parquet.md)
- [Apache Arrow - 列式内存格式](./arrow.md)
