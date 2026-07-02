---
title: Sentinel
sidebar_position: 2
slug: /middleware/sentinel
---

# Sentinel

## 简介与定位

Sentinel 是阿里巴巴开源的面向分布式服务架构的流量控制（Flow Control）与熔断降级（Circuit Breaking）组件。它以流量为切入点，提供限流、流量整形、熔断降级、系统自适应保护等能力。在微服务架构中，Sentinel 承担着**服务稳定性保障**的角色，是构建高可用系统不可或缺的防护层。

**典型使用场景：**

1. **接口限流与流量整形**：对高并发接口设置 QPS 上限和匀速排队策略，防止突发流量压垮下游服务。例如秒杀场景中将瞬时 10 万 QPS 整形为 1000 QPS 匀速通过，保护数据库不被击穿。
2. **依赖服务熔断降级**：当调用的第三方服务响应变慢或异常率飙升时，Sentinel 自动熔断该调用链路，返回预设的降级结果（如默认值或缓存数据），避免级联故障导致整个系统雪崩。

## 架构原理图解

```
┌─────────────────────────────────────────────────────┐
│                   应用进程                            │
│                                                     │
│  ┌────────────┐     ┌───────────────────────────┐  │
│  │ 业务代码   │────▶│   Sentinel Core           │  │
│  │ @SentinelResource │   (嵌入式流量防护引擎)    │  │
│  └────────────┘     │                           │  │
│                     │  ┌─────────────────────┐  │  │
│                     │  │ Slot Chain (处理链)  │  │  │
│                     │  │ • FlowSlot (限流)   │  │  │
│                     │  │ • DegradeSlot (熔断)│  │  │
│                     │  │ • SystemSlot (系统) │  │  │
│                     │  │ • AuthoritySlot     │  │  │
│                     │  └─────────────────────┘  │  │
│                     └───────────────────────────┘  │
└──────────────────────────┬──────────────────────────┘
                           │ 规则推送/拉取
                           ▼
┌─────────────────────────────────────────────────────┐
│              Sentinel Dashboard                      │
│         (可视化控制台，规则配置与实时监控)            │
│         端口: 8080                                  │
└─────────────────────────────────────────────────────┘
                           │
                           ▼ 规则持久化
┌─────────────────────────────────────────────────────┐
│     Nacos / Apollo / ZooKeeper (规则数据源)          │
└─────────────────────────────────────────────────────┘
```

## 部署方式

### Docker Compose 部署（Dashboard）

```yaml
version: "3.8"
services:
  sentinel-dashboard:
    image: bladex/sentinel-dashboard:1.8.7
    container_name: sentinel-dashboard
    ports:
      - "8858:8858"
    environment:
      JAVA_OPTS: "-Xms128m -Xmx256m"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8858/ || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 3
```

> **说明**：Sentinel 核心是嵌入在应用中的 SDK，Dashboard 仅用于可视化监控和动态规则配置。应用需配置 `-Dcsp.sentinel.dashboard.server=localhost:8858` 连接 Dashboard。

### 就绪验证命令

```bash
# 检查 Dashboard 是否启动成功
curl -s -o /dev/null -w "%{http_code}" http://localhost:8858/
# 预期输出: 200

# 访问控制台: http://localhost:8858 (sentinel/sentinel)
```

## 核心概念与术语

| 术语 | 说明 |
|------|------|
| Resource（资源） | 流量防护的目标对象，可以是接口 URL、方法名或任意自定义标识 |
| Flow Rule（流控规则） | 定义资源的 QPS 或线程数上限，超出阈值的请求被拒绝或排队 |
| Degrade Rule（熔断规则） | 基于慢调用比例或异常比例触发熔断，熔断期间所有请求直接降级 |
| Slot Chain（处理链） | Sentinel 内部的责任链架构，每个 Slot 负责一类流量规则的判断和执行 |
| Cluster Flow（集群限流） | 跨多个应用实例的全局限流，由 Token Server 统一分配令牌 |
| System Rule（系统规则） | 基于系统负载（CPU、线程数、RT）的自适应保护，全局兜底策略 |
| Fallback（降级回调） | 当请求被限流或熔断时执行的备选逻辑，返回默认值或缓存数据 |

## Java/Go 客户端接入示例

### Java 接入（Spring Cloud Alibaba Sentinel）

```java
import com.alibaba.csp.sentinel.annotation.SentinelResource;
import com.alibaba.csp.sentinel.slots.block.BlockException;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    // 定义受保护的资源，指定限流后的降级处理方法
    @SentinelResource(value = "createOrder", blockHandler = "createOrderFallback")
    public String createOrder(String userId, String productId) {
        // 正常业务逻辑：创建订单
        return "订单创建成功: " + userId + "-" + productId;
    }

    // 限流/熔断触发时的降级逻辑，返回友好提示而非报错
    public String createOrderFallback(String userId, String productId, BlockException ex) {
        return "系统繁忙，请稍后重试";
    }
}
```

```java
import com.alibaba.csp.sentinel.slots.block.flow.FlowRule;
import com.alibaba.csp.sentinel.slots.block.flow.FlowRuleManager;
import java.util.Collections;

// 编程方式配置流控规则（也可通过 Dashboard 动态配置）
public class SentinelConfig {
    public static void initRules() {
        FlowRule rule = new FlowRule();
        rule.setResource("createOrder");
        rule.setGrade(1);       // 1=QPS 模式限流
        rule.setCount(100);     // QPS 阈值为 100
        rule.setControlBehavior(0);  // 0=直接拒绝，2=匀速排队
        FlowRuleManager.loadRules(Collections.singletonList(rule));
    }
}
```

### Go 接入（sentinel-golang）

```go
package main

import (
    "fmt"
    "log"

    sentinel "github.com/alibaba/sentinel-golang/api"
    "github.com/alibaba/sentinel-golang/core/base"
    "github.com/alibaba/sentinel-golang/core/flow"
)

func main() {
    // 初始化 Sentinel，加载配置和规则
    err := sentinel.InitDefault()
    if err != nil {
        log.Fatal("Sentinel 初始化失败:", err)
    }

    // 配置流控规则：对 "my-api" 资源限制 QPS 为 50
    _, _ = flow.LoadRules([]*flow.Rule{
        {
            Resource:               "my-api",
            TokenCalculateStrategy: flow.Direct,
            ControlBehavior:        flow.Reject, // 超出阈值直接拒绝
            Threshold:              50,
        },
    })

    // 执行资源访问，Sentinel 自动判断是否允许通过
    entry, blockErr := sentinel.Entry("my-api", sentinel.WithTrafficType(base.Inbound))
    if blockErr != nil {
        // 请求被限流，执行降级逻辑
        fmt.Println("请求被限流，执行降级:", blockErr.Error())
        return
    }
    // 正常业务处理
    fmt.Println("请求通过，处理业务逻辑")
    entry.Exit()
}
```

## 生产环境注意事项

- **规则持久化**：Sentinel 默认规则存储在内存中，应用重启后丢失。生产环境务必配置 Nacos/Apollo 作为规则数据源，实现规则持久化和动态推送。
- **熔断恢复策略**：熔断时长（`timeWindow`）不宜过长，建议 5-30 秒。配合半开探测（Half-Open）机制，熔断结束后自动放行少量请求探测下游是否恢复。
- **监控与告警联动**：将 Sentinel 的实时指标（通过/拒绝 QPS、RT 分布）接入 Prometheus + Grafana，配置限流触发率和熔断次数的告警规则，及时发现流量异常。

## 常见问题与排查经验

### Q1: 限流规则配置后不生效

**现象**：Dashboard 上已配置 QPS 限制，但实际流量超过阈值仍能通过。

**排查步骤**：
1. 确认应用是否正确连接到 Dashboard（查看 Dashboard 上是否有该应用的实时数据）
2. 检查资源名是否与代码中 `@SentinelResource` 的 value 完全一致
3. 确认规则的 `grade` 参数是否正确（1=QPS, 0=线程数）

### Q2: 熔断降级后一直无法恢复

**现象**：下游服务已恢复正常，但调用方仍在执行降级逻辑。

**排查步骤**：
1. 确认熔断时长（`timeWindow`）配置是否过大，缩短为 10-30 秒
2. 检查熔断策略类型：慢调用比例熔断需确认 RT 阈值设置合理（不要过低）
3. 观察 Dashboard 上资源的实时 RT 和异常比例，确认是否仍在触发条件

### Q3: 集群限流不准确，总 QPS 超过设定阈值

**现象**：设置集群 QPS 为 1000，但监控显示实际通过量为 1200。

**排查步骤**：
1. 确认 Token Server 与各 Token Client 的网络连通性正常
2. 检查是否有实例未接入集群限流（退化为本地限流导致总量超标）
3. 适当设置 `fallbackToLocalWhenFail=true`，当 Token Server 不可用时回退到本地限流

---

## 相关教程

- [Nacos - 服务发现与配置中心](./nacos.md)
- [Apache Kafka - 分布式消息队列](./kafka.md)
