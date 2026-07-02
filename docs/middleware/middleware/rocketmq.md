---
title: RocketMQ
sidebar_position: 3
slug: /middleware/rocketmq
---

# RocketMQ

## 简介与定位

RocketMQ 是阿里巴巴开源的分布式消息中间件，经历了多次双十一大促的洗礼，后捐赠给 Apache 基金会。它以高可靠、低延迟和丰富的消息模型著称，在微服务架构中承担**事务消息与业务解耦**的角色，特别适合电商、金融等对消息可靠性要求极高的场景。

**典型使用场景：**

1. **分布式事务消息**：通过 Half Message（半消息）机制实现跨服务的最终一致性，如订单创建后扣减库存，确保两个操作要么同时成功要么同时回滚。
2. **定时/延迟消息投递**：支持 18 个延迟级别的定时消息，用于订单超时取消、优惠券过期提醒等延时业务场景，无需额外引入定时任务框架。

## 架构原理图解

```
┌──────────┐         ┌──────────────────────────────┐
│ Producer │────────▶│        NameServer             │
└──────────┘         │   (路由注册与发现中心)         │
                     └──────────┬───────────────────┘
                                │ 路由信息
                     ┌──────────▼───────────────────┐
                     │       Broker Cluster          │
                     │  ┌─────────┐  ┌─────────┐   │
                     │  │Master-A │  │Master-B │   │
                     │  │ +Slave  │  │ +Slave  │   │
                     │  └─────────┘  └─────────┘   │
                     │     CommitLog + ConsumeQueue  │
                     └──────────┬───────────────────┘
                                │
                     ┌──────────▼───────────────────┐
                     │     Consumer Group            │
                     │  Push / Pull 模式消费         │
                     └──────────────────────────────┘
```

## 部署方式

### Docker Compose 部署

```yaml
version: "3.8"
services:
  namesrv:
    image: apache/rocketmq:5.2.0
    container_name: rmq-namesrv
    ports:
      - "9876:9876"
    command: sh mqnamesrv
    environment:
      JAVA_OPT_EXT: "-Xms256m -Xmx256m"

  broker:
    image: apache/rocketmq:5.2.0
    container_name: rmq-broker
    ports:
      - "10911:10911"
    depends_on:
      - namesrv
    command: sh mqbroker -n namesrv:9876
    environment:
      JAVA_OPT_EXT: "-Xms512m -Xmx512m"
      NAMESRV_ADDR: namesrv:9876
    volumes:
      - broker_data:/home/rocketmq/store

volumes:
  broker_data:
```

### 就绪验证命令

```bash
# 检查 NameServer 是否启动成功
docker logs rmq-namesrv | tail -5

# 查看 Broker 集群状态
docker exec rmq-broker sh mqadmin clusterList -n namesrv:9876

# 创建测试 Topic
docker exec rmq-broker sh mqadmin updateTopic -n namesrv:9876 \
  -b localhost:10911 -t test-topic
```

## 核心概念与术语

| 术语 | 说明 |
|------|------|
| NameServer（名称服务） | 轻量级路由注册中心，Broker 向其注册，Producer/Consumer 从其获取路由信息 |
| Broker（消息代理） | 消息存储和转发的核心组件，分 Master/Slave 部署实现高可用 |
| Topic（主题） | 消息的一级分类，一个 Topic 下可包含多个 MessageQueue |
| MessageQueue（消息队列） | Topic 的分片单元，类似 Kafka 的 Partition，决定并行消费能力 |
| Consumer Group（消费者组） | 相同逻辑的消费者集合，支持集群模式（负载均衡）和广播模式 |
| Tag（标签） | 消息的二级分类，用于在同一 Topic 内细分不同类型的消息 |
| Half Message（半消息） | 事务消息机制的核心，消息暂时不可消费，等待本地事务执行结果确认后投递 |

## 消息队列对比

| 维度 | Apache Kafka | RabbitMQ | RocketMQ |
|------|-------------|----------|----------|
| **适用场景** | 日志采集、流计算、大数据管道 | 复杂路由、任务调度、IoT | 电商交易、金融支付、事务消息 |
| **吞吐量级别** | 百万级 msg/s | 万级 msg/s | 十万级 msg/s |
| **运维复杂度** | 中（ZK/KRaft 管理） | 低（Erlang 自运维） | 中（NameServer + Broker） |
| **消息可靠性** | 高（多副本同步） | 高（镜像/仲裁队列） | 极高（同步双写） |
| **延迟消息** | 不原生支持 | 通过 DLX + TTL 实现 | 原生支持 18 级延迟 |
| **事务消息** | 仅支持幂等生产者 | 不支持 | 原生支持分布式事务消息 |

## Java/Go 客户端接入示例

### Java 接入（rocketmq-spring-boot-starter）

```java
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.annotation.ConsumeMode;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Service;

@Service
public class RocketMQService {
    private final RocketMQTemplate rocketMQTemplate;

    public RocketMQService(RocketMQTemplate rocketMQTemplate) {
        this.rocketMQTemplate = rocketMQTemplate;
    }

    // 发送普通消息到指定 Topic，Tag 用于消费端过滤
    public void sendOrderEvent(String orderId, String eventJson) {
        rocketMQTemplate.convertAndSend("order-topic:order-created", eventJson);
    }

    // 发送延迟消息，level=3 表示延迟 10 秒（用于订单超时取消）
    public void sendDelayMessage(String message) {
        rocketMQTemplate.syncSend("delay-topic", 
            org.springframework.messaging.support.MessageBuilder.withPayload(message).build(), 
            3000, 3);
    }
}
```

### Go 接入（rocketmq-client-go）

```go
package main

import (
    "context"
    "fmt"

    "github.com/apache/rocketmq-client-go/v2"
    "github.com/apache/rocketmq-client-go/v2/primitive"
    "github.com/apache/rocketmq-client-go/v2/producer"
)

func main() {
    // 创建生产者实例，指定 NameServer 地址
    p, err := rocketmq.NewProducer(
        producer.WithNameServer([]string{"localhost:9876"}),
        producer.WithRetry(3), // 发送失败时最多重试 3 次
    )
    if err != nil {
        panic(err)
    }

    // 启动生产者，建立与 Broker 的连接
    err = p.Start()
    if err != nil {
        panic(err)
    }
    defer p.Shutdown()

    // 构造消息并同步发送，等待 Broker 确认
    msg := &primitive.Message{
        Topic: "order-topic",
        Body:  []byte(`{"orderId":"10001","amount":99.9}`),
    }
    msg.WithTag("order-created")

    res, err := p.SendSync(context.Background(), msg)
    if err != nil {
        panic(err)
    }
    fmt.Printf("发送成功: msgId=%s, queue=%s\n", res.MsgID, res.MessageQueue.String())
}
```

## 生产环境注意事项

- **同步刷盘 vs 异步刷盘**：金融场景建议使用同步刷盘（`flushDiskType=SYNC_FLUSH`）确保消息写入磁盘后才返回成功，虽然吞吐下降约 20% 但数据零丢失。
- **消费者幂等设计**：RocketMQ 保证 At Least Once（至少一次）投递，网络重试或 Rebalance 都可能导致重复消费。消费端必须基于业务唯一键做幂等校验。
- **Broker 主从同步**：推荐 Master-Slave 同步双写模式（`brokerRole=SYNC_MASTER`），当 Master 宕机时 Slave 可自动接管，RPO（Recovery Point Objective）为零。

## 常见问题与排查经验

### Q1: 消费者消费速度慢，消息持续堆积

**现象**：通过控制台查看 Consumer Lag 持续增大。

**排查步骤**：
1. 检查消费者线程池大小（`consumeThreadMin/Max`），适当增大并行度
2. 确认消费逻辑是否存在慢查询或远程调用耗时过长
3. 增加 MessageQueue 数量和消费者实例数，提升并行消费能力

### Q2: 发送消息报 "No route info of this topic" 错误

**现象**：Producer 启动后发送第一条消息即失败。

**排查步骤**：
1. 确认 NameServer 地址配置正确，且网络可达（`telnet namesrv_ip 9876`）
2. 检查 Topic 是否已在 Broker 上创建（`mqadmin topicList`）
3. 若开启了 `autoCreateTopicEnable=false`，需手动创建 Topic 后再发送

### Q3: 事务消息一直处于 HALF 状态未提交

**现象**：消费者收不到消息，Broker 日志显示事务消息回查。

**排查步骤**：
1. 确认 TransactionListener 的 `executeLocalTransaction` 方法返回了正确的状态
2. 检查 `checkLocalTransaction` 回查方法是否正确实现，能根据业务状态返回 COMMIT/ROLLBACK
3. 确认回查次数未超过 `transactionCheckMax`（默认 15 次），超过后消息会被丢弃

---

## 相关教程

- [Apache Kafka - 分布式流处理平台](./kafka.md)
- [RabbitMQ - AMQP 消息代理](./rabbitmq.md)
