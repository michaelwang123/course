---
title: Apache Kafka
sidebar_position: 1
slug: /middleware/kafka
---

# Apache Kafka

## 简介与定位

Apache Kafka 是一个分布式流处理平台（Distributed Streaming Platform），最初由 LinkedIn 开发并开源。它以高吞吐、低延迟、强持久化能力著称，是微服务架构中**异步通信与事件驱动**的核心基础设施，承担着系统间数据流转管道的角色。

**典型使用场景：**

1. **异步解耦与削峰填谷**：将订单创建、支付回调等高并发写操作通过 Kafka 异步化处理，消除服务间的强依赖，应对流量洪峰时系统吞吐可提升 10 倍以上。
2. **实时数据管道与日志聚合**：作为各微服务日志和业务事件的统一收集通道，下游对接 Elasticsearch、Flink 等系统实现实时分析和监控告警。

## 架构原理图解

```
┌──────────────┐     ┌──────────────────────────────────┐
│  Producer    │────▶│         Kafka Cluster             │
│  (生产者)    │     │  ┌────────────────────────────┐  │
└──────────────┘     │  │  Broker-1                  │  │
                     │  │  ├─ Topic-A Partition-0    │  │
┌──────────────┐     │  │  └─ Topic-B Partition-1    │  │
│  Producer    │────▶│  ├────────────────────────────┤  │
│  (生产者)    │     │  │  Broker-2                  │  │
└──────────────┘     │  │  ├─ Topic-A Partition-1    │  │
                     │  │  └─ Topic-B Partition-0    │  │
                     │  └────────────────────────────┘  │
                     │         │                         │
                     │  ┌──────▼──────┐                  │
                     │  │ ZooKeeper / │                  │
                     │  │   KRaft     │                  │
                     │  └─────────────┘                  │
                     └───────────────┬──────────────────┘
                                     │
                     ┌───────────────┼───────────────┐
                     ▼               ▼               ▼
              ┌────────────┐  ┌────────────┐  ┌────────────┐
              │ Consumer-1 │  │ Consumer-2 │  │ Consumer-3 │
              │ (消费者)   │  │ (消费者)   │  │ (消费者)   │
              └────────────┘  └────────────┘  └────────────┘
                    └── Consumer Group（消费者组）──┘
```

## 部署方式

### Docker Compose 部署（KRaft 模式）

```yaml
version: "3.8"
services:
  kafka:
    image: apache/kafka:3.7.0
    container_name: kafka-server
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_LOG_DIRS: /var/kafka-logs
      CLUSTER_ID: "MkU3OEVBNTcwNTJENDM2Qk"
    volumes:
      - kafka_data:/var/kafka-logs

volumes:
  kafka_data:
```

### 就绪验证命令

```bash
# 创建测试 Topic 验证 Kafka 是否就绪
docker exec kafka-server /opt/kafka/bin/kafka-topics.sh \
  --create --topic test-topic --partitions 3 --replication-factor 1 \
  --bootstrap-server localhost:9092

# 列出 Topic 确认创建成功
docker exec kafka-server /opt/kafka/bin/kafka-topics.sh \
  --list --bootstrap-server localhost:9092
```

## 核心概念与术语

| 术语 | 说明 |
|------|------|
| Topic（主题） | 消息的逻辑分类单元，生产者向 Topic 发送消息，消费者从 Topic 订阅消息 |
| Partition（分区） | Topic 的物理分片，每个 Partition 是一个有序的消息日志，支持并行读写 |
| Broker（代理节点） | Kafka 集群中的单个服务器实例，负责存储消息和处理客户端请求 |
| Consumer Group（消费者组） | 一组消费者共同消费一个 Topic，同一条消息只被组内一个消费者处理，实现负载均衡 |
| Offset（偏移量） | 消息在 Partition 中的唯一位置标识，消费者通过 Offset 追踪消费进度 |
| Replication（副本） | 每个 Partition 可配置多个副本分布在不同 Broker 上，提供数据冗余和故障容错 |
| KRaft | Kafka 3.x 新的共识协议，替代 ZooKeeper 管理集群元数据，简化部署架构 |

## Java/Go 客户端接入示例

### Java 接入（spring-kafka）

```java
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class KafkaService {
    private final KafkaTemplate<String, String> kafkaTemplate;

    public KafkaService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    // 发送消息到指定 Topic，Key 用于分区路由保证相同 Key 的消息有序
    public void sendMessage(String topic, String key, String message) {
        kafkaTemplate.send(topic, key, message);
    }

    // 监听消费者组内的消息，Kafka 自动均衡分区分配
    @KafkaListener(topics = "order-events", groupId = "order-service")
    public void handleOrderEvent(String message) {
        System.out.println("收到订单事件: " + message);
    }
}
```

### Go 接入（sarama）

```go
package main

import (
    "fmt"
    "github.com/IBM/sarama"
)

func main() {
    // 初始化 Kafka 生产者配置，设置消息确认级别
    config := sarama.NewConfig()
    config.Producer.Return.Successes = true
    config.Producer.RequiredAcks = sarama.WaitForAll // 等待所有副本确认，保证消息不丢失

    // 创建同步生产者连接 Kafka 集群
    producer, err := sarama.NewSyncProducer([]string{"localhost:9092"}, config)
    if err != nil {
        panic(err)
    }
    defer producer.Close()

    // 构造消息并发送到指定 Topic
    msg := &sarama.ProducerMessage{
        Topic: "order-events",
        Key:   sarama.StringEncoder("order-123"),
        Value: sarama.StringEncoder(`{"orderId":"123","status":"created"}`),
    }

    partition, offset, err := producer.SendMessage(msg)
    if err != nil {
        panic(err)
    }
    fmt.Printf("消息发送成功: partition=%d, offset=%d\n", partition, offset)
}
```

## 生产环境注意事项

- **分区数量规划**：分区数决定了消费并行度上限，建议根据预期消费者数量和目标吞吐设定。过多分区会增加选举和 Rebalance 耗时，通常单 Topic 不超过 50 个分区。
- **消息积压监控**：通过 Consumer Lag（消费延迟）指标监控消费者的处理速度，Lag 持续增长说明消费能力不足，需要扩容消费者实例或优化处理逻辑。
- **数据保留策略**：合理配置 `log.retention.hours` 和 `log.retention.bytes`，避免磁盘空间耗尽。热数据保留 7 天、冷数据归档至对象存储是常见的生产策略。

## 常见问题与排查经验

### Q1: 消费者频繁触发 Rebalance 导致消息处理中断

**现象**：消费者日志频繁出现 `Revoke partition` 和 `Assigned partition` 记录。

**排查步骤**：
1. 检查 `session.timeout.ms` 和 `heartbeat.interval.ms` 配置是否过小
2. 确认消息处理时间是否超过 `max.poll.interval.ms`（默认 5 分钟）
3. 减小 `max.poll.records` 或增大 poll 间隔超时，避免处理阻塞触发超时

### Q2: 生产者发送消息报 "NotLeaderForPartition" 错误

**现象**：部分消息发送失败，错误码为 NotLeaderOrFollower。

**排查步骤**：
1. 执行 `kafka-topics.sh --describe` 确认 Partition 的 Leader 是否正常
2. 检查是否有 Broker 宕机导致 Leader 切换，查看 `server.log` 中的选举记录
3. 客户端开启 `metadata.max.age.ms` 刷新机制，确保路由信息及时更新

### Q3: 消息顺序性问题——同一业务 Key 的消息被乱序消费

**现象**：依赖顺序的业务逻辑出现数据不一致。

**排查步骤**：
1. 确认生产者发送时是否指定了 Key（相同 Key 会路由到同一 Partition）
2. 检查消费者是否使用了多线程并行处理同一 Partition 的消息
3. 确认 `max.in.flight.requests.per.connection` 设为 1（配合幂等生产者保证严格有序）

---

## 相关教程

- [RabbitMQ - AMQP 消息代理](./rabbitmq.md)
- [RocketMQ - 分布式消息中间件](./rocketmq.md)
