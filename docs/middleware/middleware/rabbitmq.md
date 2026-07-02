---
title: RabbitMQ
sidebar_position: 2
slug: /middleware/rabbitmq
---

# RabbitMQ

## 简介与定位

RabbitMQ 是基于 AMQP（Advanced Message Queuing Protocol，高级消息队列协议）的开源消息代理，由 Erlang/OTP 编写，以其灵活的路由机制和可靠的消息投递保障著称。在微服务架构中，RabbitMQ 承担**服务间异步通信与任务调度**的角色，适合对消息路由灵活性和投递可靠性有较高要求的业务场景。

**典型使用场景：**

1. **复杂路由的事件分发**：利用 Exchange 的 Topic/Header 类型实现基于规则的消息路由，如将不同类型的通知（短信、邮件、Push）精确分发到对应的处理队列。
2. **延迟任务与重试队列**：通过 Dead Letter Exchange（死信交换机）和 TTL 机制实现延迟消息投递和失败重试，典型应用如订单超时取消、定时提醒。

## 架构原理图解

```
┌──────────┐       ┌───────────────────────────────────────┐
│ Producer │──────▶│           RabbitMQ Broker              │
└──────────┘       │                                       │
                   │  ┌──────────┐    ┌───────────────┐   │
                   │  │ Exchange │───▶│  Queue-A      │───▶ Consumer-1
                   │  │ (交换机) │    └───────────────┘   │
                   │  │          │    ┌───────────────┐   │
                   │  │  路由规则 │───▶│  Queue-B      │───▶ Consumer-2
                   │  └──────────┘    └───────────────┘   │
                   │                                       │
                   │  ┌─────────────────────────────────┐ │
                   │  │  Virtual Host (虚拟主机)         │ │
                   │  │  资源隔离 + 权限控制              │ │
                   │  └─────────────────────────────────┘ │
                   └───────────────────────────────────────┘
```

## 部署方式

### Docker Compose 部署

```yaml
version: "3.8"
services:
  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: rabbitmq-server
    ports:
      - "5672:5672"     # AMQP 协议端口
      - "15672:15672"   # 管理界面端口
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmqctl", "status"]
      interval: 15s
      timeout: 10s
      retries: 3

volumes:
  rabbitmq_data:
```

### 就绪验证命令

```bash
# 检查 RabbitMQ 节点状态
docker exec rabbitmq-server rabbitmqctl status | grep -A2 "Listeners"

# 列出已有队列确认服务正常
docker exec rabbitmq-server rabbitmqctl list_queues

# 管理界面访问: http://localhost:15672 (admin/admin123)
```

## 核心概念与术语

| 术语 | 说明 |
|------|------|
| Exchange（交换机） | 消息路由的入口，根据 Binding 规则将消息分发到一个或多个 Queue |
| Queue（队列） | 消息的存储容器，消费者从 Queue 中获取消息进行处理 |
| Binding（绑定） | Exchange 与 Queue 之间的路由规则，包含 Routing Key 匹配模式 |
| Routing Key（路由键） | 生产者发送时附带的路由标识，Exchange 据此决定消息投递目标 |
| Virtual Host（虚拟主机） | 逻辑隔离单元，不同 VHost 间的 Exchange/Queue/用户权限完全独立 |
| ACK（消息确认） | 消费者处理完消息后向 Broker 确认，未 ACK 的消息可被重新投递 |
| Dead Letter Exchange（死信交换机） | 接收被拒绝、过期或队列溢出的消息，用于实现延迟队列和失败重试 |

## Java/Go 客户端接入示例

### Java 接入（Spring AMQP）

```java
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class RabbitMQService {
    private final RabbitTemplate rabbitTemplate;

    public RabbitMQService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    // 发送消息到指定交换机，通过 routingKey 路由到目标队列
    public void sendNotification(String type, String message) {
        rabbitTemplate.convertAndSend("notification-exchange", "notify." + type, message);
    }

    // 监听邮件通知队列，自动 ACK 模式
    @RabbitListener(queues = "email-queue")
    public void handleEmailNotification(String message) {
        System.out.println("处理邮件通知: " + message);
    }
}
```

### Go 接入（amqp091-go）

```go
package main

import (
    "fmt"
    "log"

    amqp "github.com/rabbitmq/amqp091-go"
)

func main() {
    // 建立 AMQP 连接，生产环境应使用连接池复用
    conn, err := amqp.Dial("amqp://admin:admin123@localhost:5672/")
    if err != nil {
        log.Fatal("连接失败:", err)
    }
    defer conn.Close()

    // 创建 Channel，所有操作通过 Channel 完成
    ch, err := conn.Channel()
    if err != nil {
        log.Fatal(err)
    }
    defer ch.Close()

    // 声明队列（幂等操作），确保队列存在后再发送消息
    q, _ := ch.QueueDeclare("task-queue", true, false, false, false, nil)

    // 发布消息到默认交换机，routingKey 为队列名
    err = ch.Publish("", q.Name, false, false, amqp.Publishing{
        ContentType: "application/json",
        Body:        []byte(`{"task":"send_email","to":"user@example.com"}`),
    })
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("消息发送成功")
}
```

## 生产环境注意事项

- **镜像队列与仲裁队列**：单节点 RabbitMQ 存在单点故障风险。生产环境推荐使用 Quorum Queue（仲裁队列），基于 Raft 协议实现多副本同步，数据安全性优于传统镜像队列。
- **消费者预取限制**：通过 `prefetch_count` 控制消费者一次拉取的消息数量，避免单个慢消费者积压过多消息。建议设为 10-50，根据消息处理耗时动态调整。
- **连接与 Channel 管理**：每个连接开销较大（TCP + AMQP 握手），应复用连接并创建多个 Channel。但 Channel 非线程安全，每个线程应使用独立的 Channel 实例。

## 常见问题与排查经验

### Q1: 消息堆积导致内存报警，Broker 进入 Flow Control 状态

**现象**：生产者发送速度骤降，管理界面显示节点处于 `flow` 状态。

**排查步骤**：
1. 通过 `rabbitmqctl list_queues name messages` 定位堆积的队列
2. 检查消费者是否存活且处理速度正常，增加消费者实例数
3. 调整 `vm_memory_high_watermark`（默认 0.4）或为队列设置 `x-max-length` 限制

### Q2: 消费者报 "connection reset" 频繁断连

**现象**：消费者周期性地断开重连，部分消息被重复投递。

**排查步骤**：
1. 检查 `heartbeat` 超时设置（默认 60 秒），网络不稳定时适当增大
2. 确认消费者处理逻辑是否存在长时间阻塞（超过心跳超时）
3. 查看 RabbitMQ 日志 `/var/log/rabbitmq/` 确认是服务端还是客户端主动断开

### Q3: 死信队列消息无法被正确路由

**现象**：消息被拒绝后没有进入死信队列，而是直接丢失。

**排查步骤**：
1. 确认源队列的 `x-dead-letter-exchange` 和 `x-dead-letter-routing-key` 参数已正确设置
2. 确认 Dead Letter Exchange 和对应的绑定关系已创建
3. 使用 `rabbitmqctl list_queues name arguments` 验证队列参数配置

---

## 相关教程

- [Apache Kafka - 分布式流处理平台](./kafka.md)
- [RocketMQ - 分布式消息中间件](./rocketmq.md)
