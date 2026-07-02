---
title: Apache Flink
sidebar_position: 2
slug: /middleware/bigdata-flink
---

# Apache Flink

## 简介与定位

Apache Flink 是一个流批一体（Stream-Batch Unification）的分布式计算框架，以流处理（Stream Processing）为核心设计理念，批处理被视为流处理的特殊情况。Flink 提供精确一次（Exactly-Once）语义保证和毫秒级延迟，是实时数据处理领域的事实标准。适用数据规模：**TB-PB 级**。

## 依赖引入方式

```xml
<!-- Maven 引入 Flink 核心依赖 -->
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-streaming-java</artifactId>
    <version>1.19.0</version>
</dependency>
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-clients</artifactId>
    <version>1.19.0</version>
</dependency>
```

## 核心概念与架构说明

Flink 的核心概念包括 DataStream（数据流）和 Table API/SQL 两套编程接口。流批一体通过统一的 DataStream API 实现：有界流（Bounded Stream）对应批处理，无界流（Unbounded Stream）对应实时计算。Flink 采用 JobManager-TaskManager 架构，JobManager 负责作业调度和 Checkpoint（检查点）协调，TaskManager 执行具体算子。Checkpoint 机制基于 Chandy-Lamport 算法实现分布式快照，保障 Exactly-Once 语义。

## 实战代码示例

### 示例一：实时窗口聚合

```java
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.windowing.time.Time;

public class FlinkWindowDemo {
    public static void main(String[] args) throws Exception {
        // 创建流执行环境，Flink 程序的统一入口
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        // 启用 Checkpoint，每 60 秒做一次状态快照保证容错
        env.enableCheckpointing(60000);

        // 从 Kafka 消费订单事件流，按用户 ID 分组后做 5 分钟滑动窗口聚合
        DataStream<OrderEvent> orders = env.addSource(new KafkaOrderSource());

        orders.keyBy(OrderEvent::getUserId)
              .timeWindow(Time.minutes(5))
              .sum("amount")
              .print();

        // 提交作业执行，Flink 为长期运行的流式应用
        env.execute("Order Window Aggregation");
    }
}
```

### 示例二：Flink SQL 流批一体查询（含性能对比）

```java
import org.apache.flink.table.api.EnvironmentSettings;
import org.apache.flink.table.api.TableEnvironment;

public class FlinkSQLDemo {
    public static void main(String[] args) {
        // 创建 Table 环境，流模式下支持持续查询(Continuous Query)
        EnvironmentSettings settings = EnvironmentSettings.newInstance()
                .inStreamingMode()
                .build();
        TableEnvironment tableEnv = TableEnvironment.create(settings);

        // 使用 DDL 定义 Kafka 数据源表，Flink SQL 隐藏了底层复杂性
        // 性能对比：同样的聚合逻辑，Flink SQL 延迟 <1s，Spark Structured Streaming 约 2-5s
        tableEnv.executeSql(
            "CREATE TABLE orders (" +
            "  user_id STRING, amount DOUBLE, order_time TIMESTAMP(3)," +
            "  WATERMARK FOR order_time AS order_time - INTERVAL '5' SECOND" +
            ") WITH ('connector' = 'kafka', 'topic' = 'orders')"
        );

        // 执行持续聚合查询，结果实时更新
        tableEnv.executeSql(
            "SELECT user_id, SUM(amount) as total " +
            "FROM orders GROUP BY user_id"
        ).print();
    }
}
```

> **性能对比说明**：在 Kafka 10 万条/秒的吞吐场景下，Flink 端到端延迟稳定在 200-500ms，而 Spark Structured Streaming 的 micro-batch 模式延迟通常在 2-10 秒。Flink 的优势在于原生流处理架构，无需攒批。

## 大数据场景下的最佳实践

- **合理配置 Checkpoint 间隔**：间隔过短增加状态后端压力，过长则故障恢复时丢失数据较多；生产环境建议 1-5 分钟，结合 RocksDB State Backend 处理 TB 级状态
- **使用 Watermark 处理乱序数据**：设置合理的允许延迟（Allowed Lateness），避免因网络抖动导致大量数据被丢弃

## 使用心得与踩坑经验

- 反压（Backpressure）是 Flink 生产环境最常见的问题，通常由下游算子处理慢引起，需通过 Web UI 的反压监控定位瓶颈算子
- State TTL（状态存活时间）务必设置，否则无界流场景下状态会无限增长直至 OOM

## 相关教程

- [Apache Spark - 批处理计算引擎](./spark.md)
- [Apache Calcite - SQL 解析与优化](./calcite.md)
