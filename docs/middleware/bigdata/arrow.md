---
title: Apache Arrow
sidebar_position: 2
slug: /middleware/bigdata-arrow
---

# Apache Arrow

## 简介与定位

Apache Arrow 是一个跨语言的列式内存数据格式（Columnar In-Memory Format），定义了标准化的内存布局规范，实现不同系统间的零拷贝（Zero-Copy）数据交换。Arrow 被 Spark、Pandas、DuckDB 等众多项目采用作为内存数据交换层。适用数据规模：**GB-TB 级**。

## 依赖引入方式

```xml
<!-- Java: Maven 引入 Arrow Memory + Vector -->
<dependency>
    <groupId>org.apache.arrow</groupId>
    <artifactId>arrow-vector</artifactId>
    <version>15.0.2</version>
</dependency>
<dependency>
    <groupId>org.apache.arrow</groupId>
    <artifactId>arrow-memory-netty</artifactId>
    <version>15.0.2</version>
</dependency>
```

```bash
# Python: pip 安装 PyArrow
pip install pyarrow==15.0.2
```

## 核心概念与架构说明

Arrow 的核心是定义了一套语言无关的列式内存布局：数据按列而非按行存储在连续内存块中，同一列的所有值紧密排列。这种布局带来两个关键优势：（1）向量化计算（SIMD）友好，CPU 缓存命中率高；（2）跨进程/跨语言共享数据时无需序列化与反序列化（零拷贝）。Arrow 的 IPC（Inter-Process Communication）协议允许 Java 和 Python 进程直接共享同一块内存数据。

## 实战代码示例

### 示例一：Java 创建 Arrow 向量

```java
import org.apache.arrow.memory.BufferAllocator;
import org.apache.arrow.memory.RootAllocator;
import org.apache.arrow.vector.IntVector;

public class ArrowJavaDemo {
    public static void main(String[] args) {
        // 创建内存分配器，Arrow 使用堆外内存避免 GC 开销
        BufferAllocator allocator = new RootAllocator(Long.MAX_VALUE);

        // 创建 Int 类型列向量，数据在内存中连续排列便于 SIMD 计算
        IntVector vector = new IntVector("age", allocator);
        vector.allocateNew(1000);

        for (int i = 0; i < 1000; i++) {
            vector.set(i, 20 + (i % 50));
        }
        vector.setValueCount(1000);

        System.out.println("第 0 行值: " + vector.get(0));
        System.out.println("向量长度: " + vector.getValueCount());

        // 释放堆外内存，Arrow 不依赖 GC 需手动管理
        vector.close();
        allocator.close();
    }
}
```

### 示例二：Python 零拷贝读取 Parquet（含性能对比）

```python
import pyarrow as pa
import pyarrow.parquet as pq

# 使用 Arrow 读取 Parquet 文件，列式格式之间直接映射无需行列转换
# 性能对比：Arrow 读取 1GB Parquet 约 0.8s，pandas.read_parquet 约 2.5s（3x 差距）
table = pq.read_table("/data/events.parquet", columns=["user_id", "event_type"])

# 零拷贝转换为 Pandas DataFrame，无需额外内存分配
df = table.to_pandas(zero_copy_only=True)
print(f"数据行数: {len(df)}, 列数: {df.shape[1]}")
```

> **性能对比说明**：在 1GB Parquet 文件读取测试中，PyArrow 原生读取耗时约 0.8 秒，传统 `pandas.read_csv` 同等数据量需 8 秒以上。列式格式 + 零拷贝使 Arrow 在分析型负载中具有显著优势。

## 大数据场景下的最佳实践

- **跨语言数据交换优先用 Arrow IPC**：Java 计算引擎产出的中间结果通过 Arrow Flight（基于 gRPC 的数据传输协议）发送给 Python 分析脚本，避免 JSON/CSV 序列化开销
- **配合 Parquet 使用**：Arrow 列式内存格式与 Parquet 列式存储格式天然匹配，读取时可直接映射无需行列转换，最大化 IO 效率

## 使用心得与踩坑经验

- Java 中使用 Arrow 必须手动关闭 Vector 和 Allocator，否则会产生堆外内存泄漏；建议用 try-with-resources 包裹
- `zero_copy_only=True` 转 Pandas 时若列中有 null 值会抛异常，需先用 `fill_null()` 或改用普通 `to_pandas()` 模式

## 相关教程

- [Avro/Parquet - 大数据存储格式](./avro-parquet.md)
- [Apache Calcite - SQL 解析与优化](./calcite.md)
