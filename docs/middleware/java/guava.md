---
title: Guava
sidebar_position: 1
slug: /middleware/java-guava
---

# Guava

## 简介与定位

Guava 是 Google 开源的 Java 核心类库，提供了集合处理、缓存、并发工具、字符串处理、I/O 操作等丰富的工具类。它是 Java 标准库的强力补充，被广泛应用于 Google 内部及全球 Java 项目中。

与同类库的差异：相比 Apache Commons 的"工具方法集合"定位，Guava 更注重提供**不可变集合（Immutable Collections）**、**函数式编程支持**和**高性能本地缓存**等高级抽象。相比 Hutool 的"中文友好全功能"定位，Guava 在 API 设计上更加严谨，遵循 Google 的 Java 编码规范，适合对代码质量有较高要求的团队。

## Maven 坐标

```xml
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
    <version>33.0.0-jre</version>
</dependency>
```

> **注意**：Guava 提供 `-jre` 和 `-android` 两个版本后缀，普通后端项目使用 `-jre` 版本即可。

## 核心功能与 API 速查

| API / 功能 | 用途说明 |
|------------|---------|
| `ImmutableList.of()` | 创建不可变列表，线程安全且不允许 null 元素 |
| `Lists.partition()` | 将大列表按指定大小分割为多个子列表，适用于批量处理 |
| `Maps.uniqueIndex()` | 根据集合元素的某个属性构建唯一索引 Map |
| `Strings.isNullOrEmpty()` | 判断字符串是否为 null 或空串，避免 NPE |
| `Joiner.on()` | 链式拼接字符串，支持跳过 null 值 |
| `Splitter.on()` | 灵活分割字符串，支持去除空白和过滤空串 |
| `Cache / LoadingCache` | 本地缓存实现，支持过期策略、最大容量限制和自动加载 |
| `Preconditions.checkArgument()` | 方法参数校验，不满足条件时抛出 IllegalArgumentException |
| `Optional` (Guava 版) | 显式处理可能为空的值（Java 8 后建议使用 JDK 自带的 Optional） |
| `EventBus` | 进程内事件发布/订阅机制，解耦组件间通信 |

## 实战代码示例

### 示例一：不可变集合与列表分割

```java
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Lists;

import java.util.List;

public class GuavaCollectionDemo {
    public static void main(String[] args) {
        // 创建不可变列表，任何修改操作都会抛出 UnsupportedOperationException
        ImmutableList<String> immutableList = ImmutableList.of("Java", "Go", "Python", "Rust");

        // 将列表按每组2个元素进行分割，常用于数据库批量插入场景
        List<List<String>> partitioned = Lists.partition(immutableList, 2);

        // 输出分割后的子列表，每个子列表包含最多2个元素
        for (List<String> subList : partitioned) {
            System.out.println("子列表: " + subList);
        }
        // 输出: 子列表: [Java, Go]
        //       子列表: [Python, Rust]
    }
}
```

### 示例二：本地缓存 LoadingCache

```java
import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.ExecutionException;

public class GuavaCacheDemo {
    public static void main(String[] args) throws ExecutionException {
        // 构建本地缓存：最大容量1000条，写入后10分钟过期
        // 适用于数据库查询结果缓存、配置信息缓存等场景
        LoadingCache<String, String> cache = CacheBuilder.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .build(new CacheLoader<String, String>() {
                    @Override
                    public String load(String key) {
                        // 缓存未命中时的加载逻辑，这里模拟从数据库查询
                        return queryFromDatabase(key);
                    }
                });

        // 获取缓存值，首次调用会触发 load 方法
        String value = cache.get("user:1001");
        System.out.println("缓存值: " + value);

        // 查看缓存统计信息（需在构建时启用 recordStats）
        System.out.println("缓存大小: " + cache.size());
    }

    private static String queryFromDatabase(String key) {
        // 模拟数据库查询，实际项目中替换为真实查询逻辑
        return "value_for_" + key;
    }
}
```

### 示例三：字符串处理与前置条件校验

```java
import com.google.common.base.Joiner;
import com.google.common.base.Splitter;
import com.google.common.base.Preconditions;
import com.google.common.base.Strings;

import java.util.List;

public class GuavaStringDemo {
    public static void main(String[] args) {
        // 使用 Joiner 拼接字符串，自动跳过 null 值，避免手动判空
        String joined = Joiner.on(", ")
                .skipNulls()
                .join("Redis", null, "Kafka", "RabbitMQ");
        System.out.println("拼接结果: " + joined);
        // 输出: 拼接结果: Redis, Kafka, RabbitMQ

        // 使用 Splitter 分割字符串，去除前后空白并过滤空串
        List<String> parts = Splitter.on(",")
                .trimResults()
                .omitEmptyStrings()
                .splitToList(" Java , , Go , Rust ");
        System.out.println("分割结果: " + parts);
        // 输出: 分割结果: [Java, Go, Rust]

        // 前置条件校验：参数不满足条件时立即抛出异常，让问题尽早暴露
        String input = "hello";
        Preconditions.checkArgument(!Strings.isNullOrEmpty(input), "输入不能为空");
        System.out.println("校验通过，输入值: " + input);
    }
}
```

## 使用心得与踩坑经验

### 心得一：不可变集合并非万能银弹

在项目初期，我曾大范围使用 `ImmutableList` 和 `ImmutableMap` 替代所有集合声明，认为这样能彻底避免并发修改问题。但实际开发中发现，不可变集合在需要频繁增删元素的场景下会产生大量临时对象，对 GC（垃圾回收）压力较大。后来总结出的经验是：对于配置类数据、常量枚举、方法返回值等"创建后不再修改"的场景使用不可变集合效果最佳；而对于缓冲区、中间计算结果等需要动态变化的数据，仍应使用普通可变集合，在必要时通过 `Collections.unmodifiableList()` 提供只读视图即可。

### 心得二：LoadingCache 的 refreshAfterWrite 与 expireAfterWrite 容易混淆

`expireAfterWrite` 会在过期后阻塞请求直到新值加载完成，而 `refreshAfterWrite` 会返回旧值并在后台异步刷新。在生产环境中，如果缓存的加载逻辑耗时较长（如调用外部 API），推荐使用 `refreshAfterWrite` 配合 `asyncReloading` 来避免缓存穿透导致的请求堆积。我曾因混用两者导致高峰期接口响应时间飙升到数秒，排查后才发现是 `expireAfterWrite` 触发了同步加载。正确做法是将两者结合使用：`expireAfterWrite` 设置为较长时间作为兜底，`refreshAfterWrite` 设置为较短时间保证数据新鲜度。

### 心得三：EventBus 适合简单场景但不适合复杂事件驱动架构

Guava EventBus 的设计非常轻量，没有持久化、重试、顺序保证等特性。在一个小型项目中用它做模块间解耦效果很好，但当系统规模扩大到需要跨服务通信时，应该及时切换到 Kafka 或 RabbitMQ 等专业消息中间件，而非继续叠加 EventBus 的用法。

## 适用场景建议

### ✅ 推荐使用的场景

1. **本地缓存需求**：需要在单个 JVM 内缓存热点数据（如用户信息、配置项），且不需要分布式一致性时，`LoadingCache` 比手写 `ConcurrentHashMap` + 定时清理更加可靠和高效。

2. **集合数据的批量处理**：使用 `Lists.partition()` 进行批量数据库写入、`Maps.uniqueIndex()` 构建查找索引、`ImmutableList` 作为方法返回值确保调用方无法篡改结果——这些场景 Guava 的 API 比手写循环更简洁且不易出错。

3. **防御性编程与参数校验**：结合 `Preconditions` 系列方法在方法入口处做快速失败（Fail-Fast）校验，使错误尽早暴露而非在深层逻辑中引发难以追踪的 NPE。更多 Java 工具库的参数校验方案可参考 [Apache Commons](./apache-commons.md) 中的 `Validate` 工具类。

### ❌ 不推荐使用的场景

1. **分布式缓存需求**：如果你的缓存需要跨多个服务节点共享和同步，Guava Cache 无法满足——应选用 Redis 等分布式缓存方案。Guava Cache 是纯本地内存缓存，不支持集群间数据同步。需要全功能工具包且偏好中文文档的团队也可以考虑 [Hutool](./hutool.md) 提供的缓存封装。

---

## 相关教程

- [Apache Commons - Java 通用工具库](./apache-commons.md)
- [Hutool - 中文友好的 Java 工具类库](./hutool.md)
- [Lombok - Java 样板代码消除器](./lombok.md)
