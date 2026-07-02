---
title: Nacos
sidebar_position: 1
slug: /middleware/nacos
---

# Nacos

## 简介与定位

Nacos（Dynamic Naming and Configuration Service）是阿里巴巴开源的服务发现（Service Discovery）与配置管理（Configuration Management）平台。它将注册中心和配置中心融为一体，在微服务架构中承担着**服务治理基础设施**的角色，是 Spring Cloud Alibaba 生态的核心组件。

**典型使用场景：**

1. **微服务注册与发现**：各微服务启动时向 Nacos 注册实例信息，消费端通过服务名进行负载均衡调用，无需硬编码 IP 地址。支持健康检查和自动剔除不可用实例，保障服务调用的可用性。
2. **动态配置管理**：将应用配置（数据库连接、开关参数、限流阈值等）集中存储在 Nacos，支持实时推送变更到所有实例，无需重启服务即可生效。适用于灰度发布、A/B 测试等场景。

## 架构原理图解

```
┌──────────────────────────────────────────────────────┐
│                    Nacos Server                        │
│                                                      │
│  ┌─────────────────┐    ┌─────────────────────────┐ │
│  │  Naming Module  │    │  Config Module           │ │
│  │  (服务注册发现)  │    │  (配置管理)              │ │
│  │                 │    │                          │ │
│  │ • 实例注册/注销 │    │ • 配置存储 (MySQL/内嵌DB)│ │
│  │ • 健康检查      │    │ • 配置版本与回滚         │ │
│  │ • 服务路由      │    │ • 实时推送 (Long Polling)│ │
│  └─────────────────┘    └─────────────────────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │         Cluster (Raft / Distro 协议)          │   │
│  │    Node-1 ←──→ Node-2 ←──→ Node-3           │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
         ▲                          ▲
         │ 注册/心跳                 │ 拉取配置/监听变更
┌────────┴───────┐          ┌───────┴────────┐
│ Service-A      │          │ Service-B      │
│ (Provider)     │          │ (Consumer)     │
└────────────────┘          └────────────────┘
```

## 部署方式

### Docker Compose 部署（单机模式）

```yaml
version: "3.8"
services:
  nacos:
    image: nacos/nacos-server:v2.3.1
    container_name: nacos-server
    ports:
      - "8848:8848"   # 主端口
      - "9848:9848"   # gRPC 端口
    environment:
      MODE: standalone
      SPRING_DATASOURCE_PLATFORM: ""
      JVM_XMS: 256m
      JVM_XMX: 512m
    volumes:
      - nacos_data:/home/nacos/data
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8848/nacos/v1/console/health/readiness || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  nacos_data:
```

### 就绪验证命令

```bash
# 检查 Nacos 健康状态
curl -s http://localhost:8848/nacos/v1/console/health/readiness
# 预期输出: OK

# 访问控制台: http://localhost:8848/nacos (nacos/nacos)
# 发布测试配置验证配置中心功能
curl -X POST "http://localhost:8848/nacos/v1/cs/configs" \
  -d "dataId=test.yaml&group=DEFAULT_GROUP&content=server.port=8080"
```

## 核心概念与术语

| 术语 | 说明 |
|------|------|
| Namespace（命名空间） | 环境隔离单元，不同 Namespace 间的配置和服务完全隔离（如 dev/test/prod） |
| Group（分组） | 服务或配置的逻辑分组，同一 Namespace 下可通过 Group 进一步细分 |
| DataId | 配置文件的唯一标识，通常命名为 `应用名-环境.格式`（如 `order-service-prod.yaml`） |
| Service（服务） | 注册中心中的服务定义，包含服务名、集群信息和实例列表 |
| Instance（实例） | 服务的一个运行节点，包含 IP、端口、权重和健康状态等元数据 |
| Long Polling（长轮询） | 配置变更监听机制，客户端发起长连接请求等待服务端推送变更通知 |
| Ephemeral Instance（临时实例） | 通过心跳维持注册的实例，心跳超时后自动注销，适用于 Spring Cloud 微服务 |

## Java/Go 客户端接入示例

### Java 接入（Spring Cloud Alibaba）

```java
// application.yml 配置
// spring.cloud.nacos.discovery.server-addr: localhost:8848
// spring.cloud.nacos.config.server-addr: localhost:8848

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RefreshScope  // 支持配置变更后自动刷新
public class ConfigController {
    // 从 Nacos 配置中心读取限流阈值，变更后实时生效
    @Value("${rate-limit.qps:100}")
    private int rateLimitQps;

    // 读取动态配置的接口，用于验证配置实时推送能力
    @GetMapping("/config/rate-limit")
    public String getRateLimit() {
        return "当前限流 QPS: " + rateLimitQps;
    }
}
```

### Go 接入（nacos-sdk-go）

```go
package main

import (
    "fmt"

    "github.com/nacos-group/nacos-sdk-go/v2/clients"
    "github.com/nacos-group/nacos-sdk-go/v2/common/constant"
    "github.com/nacos-group/nacos-sdk-go/v2/vo"
)

func main() {
    // 配置 Nacos Server 连接信息
    sc := []constant.ServerConfig{
        {IpAddr: "localhost", Port: 8848},
    }
    cc := constant.ClientConfig{
        NamespaceId: "public",
        TimeoutMs:   5000,
    }

    // 创建配置客户端，用于读取和监听配置变更
    configClient, err := clients.NewConfigClient(
        vo.NacosClientParam{ClientConfig: &cc, ServerConfigs: sc},
    )
    if err != nil {
        panic(err)
    }

    // 获取指定配置内容
    content, _ := configClient.GetConfig(vo.ConfigParam{
        DataId: "app-config.yaml",
        Group:  "DEFAULT_GROUP",
    })
    fmt.Println("配置内容:", content)

    // 监听配置变更，收到变更后回调处理
    configClient.ListenConfig(vo.ConfigParam{
        DataId: "app-config.yaml",
        Group:  "DEFAULT_GROUP",
        OnChange: func(namespace, group, dataId, data string) {
            fmt.Printf("配置已变更: dataId=%s, 新内容=%s\n", dataId, data)
        },
    })
}
```

## 生产环境注意事项

- **集群部署与数据持久化**：生产环境必须以集群模式（≥3 节点）部署 Nacos，配置使用 MySQL 外置数据源存储，避免使用内嵌 Derby 数据库。集群间通过 Raft 协议保证数据一致性。
- **Namespace 环境隔离**：严格为 dev/test/staging/prod 创建独立的 Namespace，防止测试环境的配置变更影响生产服务。配合 IP 白名单限制各环境只能访问对应的 Namespace。
- **配置变更审计**：开启配置变更历史记录，配合灰度发布（Beta 发布）策略。重要配置变更先推送给少量实例验证，确认无误后再全量推送，降低错误配置导致的服务雪崩风险。

## 常见问题与排查经验

### Q1: 服务注册成功但消费端无法发现

**现象**：服务在 Nacos 控制台可见，但调用方报 `No instances available`。

**排查步骤**：
1. 确认消费方和提供方使用相同的 Namespace 和 Group
2. 检查实例的健康状态是否为 true（心跳超时会被标记为不健康）
3. 确认消费方的 `spring.cloud.nacos.discovery.server-addr` 配置正确

### Q2: 配置变更后应用未实时生效

**现象**：在 Nacos 控制台修改配置后，应用中的值未更新。

**排查步骤**：
1. 确认使用 `@RefreshScope` 注解或实现 `Listener` 接口监听变更
2. 检查 DataId 和 Group 是否与应用配置中声明的完全一致（区分大小写）
3. 查看应用日志中是否有 `Refresh Nacos config` 相关的刷新记录

### Q3: Nacos 集群节点间数据不同步

**现象**：不同节点上查询同一服务的实例列表不一致。

**排查步骤**：
1. 检查各节点的 `cluster.conf` 配置是否包含所有集群成员地址
2. 确认节点间网络互通，gRPC 端口（9848/9849）未被防火墙拦截
3. 查看 Nacos 日志中 Raft 选举和数据同步的错误信息

---

## 相关教程

- [Sentinel - 流量控制与熔断降级](./sentinel.md)
- [Redis - 分布式缓存](./redis.md)
