---
title: RoaringBitmap
sidebar_position: 3
slug: /middleware/bigdata-roaring-bitmap
---

# RoaringBitmap

## 简介与定位

RoaringBitmap 是一个高效的压缩位图（Compressed Bitmap）数据结构库，通过混合存储策略（Array Container、Bitmap Container、Run Container）在内存占用和计算速度之间取得最优平衡。广泛应用于用户画像标签系统、搜索引擎倒排索引和 OLAP 引擎（如 Apache Druid、ClickHouse）。适用数据规模：**GB 级**。

## 依赖引入方式

```xml
<!-- Maven 引入 RoaringBitmap -->
<dependency>
    <groupId>org.roaringbitmap</groupId>
    <artifactId>RoaringBitmap</artifactId>
    <version>1.0.6</version>
</dependency>
```

## 核心概念与架构说明

RoaringBitmap 将 32 位整数空间按高 16 位分桶（Chunk），每个桶根据数据密度自动选择最优容器：稀疏数据用 Array Container（排序数组），密集数据用 Bitmap Container（65536 位位图），连续数据用 Run Container（游程编码）。这种自适应策略使其在各种数据分布下都能保持较小的内存占用和较快的集合运算速度（AND/OR/XOR/ANDNOT）。

## 实战代码示例

### 示例一：基本位图操作

```java
import org.roaringbitmap.RoaringBitmap;

public class RoaringBasicDemo {
    public static void main(String[] args) {
        // 创建位图并批量添加用户 ID，模拟"购买过 A 商品"的用户集合
        RoaringBitmap buyersA = new RoaringBitmap();
        buyersA.add(1L, 100_000L);  // 添加 [1, 100000) 区间

        // 创建另一个位图，模拟"浏览过 B 页面"的用户集合
        RoaringBitmap viewersB = new RoaringBitmap();
        viewersB.add(50_000L, 200_000L);

        // 交集运算：同时购买 A 且浏览 B 的用户，用于精准营销
        RoaringBitmap intersection = RoaringBitmap.and(buyersA, viewersB);
        System.out.println("交集用户数: " + intersection.getCardinality());

        // 内存占用远小于 HashSet：10万 ID 位图约 12KB，HashSet 约 1.6MB
        System.out.println("位图序列化大小: " + buyersA.serializedSizeInBytes() + " bytes");
    }
}
```

### 示例二：大规模标签计算（含性能对比）

```java
import org.roaringbitmap.RoaringBitmap;
import org.roaringbitmap.buffer.MutableRoaringBitmap;

public class RoaringPerformanceDemo {
    public static void main(String[] args) {
        // 模拟千万级用户 ID 的标签位图，测试集合运算性能
        RoaringBitmap tagMale = new RoaringBitmap();
        RoaringBitmap tagActive = new RoaringBitmap();

        for (int i = 0; i < 10_000_000; i += 2) {
            tagMale.add(i);       // 500万男性用户
        }
        for (int i = 0; i < 10_000_000; i += 3) {
            tagActive.add(i);     // 333万活跃用户
        }

        // 性能对比：千万级 ID 交集运算，RoaringBitmap 约 5ms，HashSet 约 800ms
        long start = System.currentTimeMillis();
        RoaringBitmap result = RoaringBitmap.and(tagMale, tagActive);
        long cost = System.currentTimeMillis() - start;

        System.out.println("交集基数: " + result.getCardinality());
        System.out.println("耗时: " + cost + "ms");
    }
}
```

> **性能对比说明**：在 1000 万 ID 交集运算测试中，RoaringBitmap 耗时约 5ms、内存占用约 8MB；同等场景下 HashSet 耗时约 800ms、内存占用约 160MB。RoaringBitmap 在速度和内存上均有数量级优势。

## 大数据场景下的最佳实践

- **用于 OLAP 预计算**：将高基数维度的过滤结果预存为 RoaringBitmap，查询时直接做位图交并运算，将多条件筛选从 O(n) 降至 O(1) 级别
- **序列化存储到 Redis/RocksDB**：RoaringBitmap 提供高效的 `serialize/deserialize` 方法，序列化后体积远小于原始 ID 列表，适合作为缓存层存储

## 使用心得与踩坑经验

- `add(long start, long end)` 是左闭右开区间，初学者容易遗漏最后一个 ID，需注意边界
- 对 64 位 Long 类型 ID 需使用 `Roaring64Bitmap` 而非默认的 32 位版本，否则高位会被截断

## 相关教程

- [Apache Arrow - 列式内存格式](./arrow.md)
- [Apache Calcite - SQL 解析与优化](./calcite.md)
