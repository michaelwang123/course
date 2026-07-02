---
title: Elasticsearch
sidebar_position: 1
slug: /middleware/elasticsearch
---

# Elasticsearch

## 简介与定位

Elasticsearch（简称 ES）是基于 Apache Lucene 构建的分布式搜索与分析引擎，支持近实时（Near Real-Time）的全文检索、结构化搜索和数据分析。在微服务架构中，ES 承担着**全文搜索服务与日志分析平台**的角色，是 ELK（Elasticsearch + Logstash + Kibana）技术栈的核心组件。

**典型使用场景：**

1. **商品/内容全文搜索**：为电商商品、文章内容提供毫秒级的模糊搜索、分词匹配和相关性排序能力，支持高亮显示和搜索建议，替代数据库 LIKE 查询提升体验。
2. **分布式日志检索与监控**：汇聚各微服务的日志数据，通过 Kibana 可视化查询和告警，实现秒级的故障定位和链路追踪分析。

## 架构原理图解

```
┌─────────────────────────────────────────────────┐
│           Elasticsearch Cluster                  │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Node-1  │  │  Node-2  │  │  Node-3  │     │
│  │ (Master) │  │ (Data)   │  │ (Data)   │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│       │              │              │           │
│  ┌────▼──────────────▼──────────────▼────┐     │
│  │          Index: products              │     │
│  │  Shard-0(P)  Shard-1(P)  Shard-2(P)  │     │
│  │  Shard-0(R)  Shard-1(R)  Shard-2(R)  │     │
│  └───────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
         │                          ▲
         ▼                          │
┌──────────────┐           ┌───────────────┐
│   Kibana     │           │  Logstash /   │
│  (可视化)    │           │  应用写入     │
└──────────────┘           └───────────────┘
```

## 部署方式

### Docker Compose 部署

```yaml
version: "3.8"
services:
  elasticsearch:
    image: elasticsearch:8.13.0
    container_name: es-server
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - es_data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 5

volumes:
  es_data:
```

### 就绪验证命令

```bash
# 检查集群健康状态
curl -s http://localhost:9200/_cluster/health | python3 -m json.tool

# 预期输出 status 为 green 或 yellow（单节点为 yellow）
# 查看节点信息
curl -s http://localhost:9200/_cat/nodes?v
```

## 核心概念与术语

| 术语 | 说明 |
|------|------|
| Index（索引） | 文档的集合，类似关系型数据库中的"表"，是搜索和分析的基本单位 |
| Document（文档） | Index 中的单条数据记录，以 JSON 格式存储，类似数据库中的"行" |
| Shard（分片） | Index 的物理切分单元，分为 Primary Shard（主分片）和 Replica Shard（副本分片） |
| Mapping（映射） | 定义文档字段的数据类型和索引方式，类似数据库的 Schema 定义 |
| Analyzer（分析器） | 文本分词组件，由字符过滤器、分词器和 Token 过滤器组成，决定全文检索的精度 |
| Query DSL | ES 特有的 JSON 格式查询语言，支持全文搜索、精确匹配、范围过滤和聚合分析 |
| Inverted Index（倒排索引） | ES 底层核心数据结构，将词项映射到包含该词的文档列表，实现高效全文检索 |

## Java/Go 客户端接入示例

### Java 接入（Elasticsearch Java Client）

```java
import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.IndexResponse;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.rest_client.RestClientTransport;
import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;

public class EsService {
    private final ElasticsearchClient client;

    public EsService() {
        // 初始化 ES 客户端连接，指定集群地址
        var restClient = RestClient.builder(new HttpHost("localhost", 9200)).build();
        var transport = new RestClientTransport(restClient, new JacksonJsonpMapper());
        this.client = new ElasticsearchClient(transport);
    }

    // 索引文档：将商品数据写入 products 索引
    public void indexProduct(String id, String name, double price) throws Exception {
        IndexResponse resp = client.index(i -> i
            .index("products")
            .id(id)
            .document(new Product(name, price))
        );
        System.out.println("索引结果: " + resp.result());
    }

    // 全文搜索：根据关键词搜索商品名称
    public void searchProducts(String keyword) throws Exception {
        SearchResponse<Product> resp = client.search(s -> s
            .index("products")
            .query(q -> q.match(m -> m.field("name").query(keyword))),
            Product.class
        );
        for (Hit<Product> hit : resp.hits().hits()) {
            System.out.println("命中: " + hit.source().name);
        }
    }
}

record Product(String name, double price) {}
```

### Go 接入（go-elasticsearch）

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "log"

    "github.com/elastic/go-elasticsearch/v8"
)

func main() {
    // 创建 ES 客户端，配置集群节点地址
    es, err := elasticsearch.NewClient(elasticsearch.Config{
        Addresses: []string{"http://localhost:9200"},
    })
    if err != nil {
        log.Fatal(err)
    }

    // 构造文档数据并索引到 products 索引
    doc := map[string]interface{}{
        "name":  "Go 语言编程指南",
        "price": 59.9,
    }
    body, _ := json.Marshal(doc)

    // 执行索引操作，将文档写入 ES
    res, err := es.Index("products", bytes.NewReader(body))
    if err != nil {
        log.Fatal(err)
    }
    defer res.Body.Close()
    fmt.Println("索引状态:", res.Status())
}
```

## 生产环境注意事项

- **分片规划**：单个分片建议控制在 10-50GB，过大会影响查询性能和故障恢复速度。索引创建后 Primary Shard 数量无法修改，需提前规划。
- **Mapping 管理**：生产环境应禁用 Dynamic Mapping 的自动字段类型推断，使用 Strict 模式确保字段类型可控，避免因错误数据导致 Mapping 膨胀。
- **JVM 堆内存**：ES 的 JVM 堆内存建议设为物理内存的一半且不超过 32GB（超过 32GB 会失去指针压缩优化）。剩余内存留给 Lucene 的文件系统缓存。

## 常见问题与排查经验

### Q1: 集群状态为 RED，部分索引不可用

**现象**：`_cluster/health` 返回 `status: red`，部分搜索请求报错。

**排查步骤**：
1. 执行 `_cat/indices?v&health=red` 定位问题索引
2. 执行 `_cluster/allocation/explain` 查看分片无法分配的原因
3. 常见原因：磁盘空间超过 watermark 阈值（默认 85%），释放磁盘或调整阈值

### Q2: 搜索结果不符合预期，中文分词不准确

**现象**：搜索"手机壳"无法匹配到"苹果手机保护壳"的文档。

**排查步骤**：
1. 使用 `_analyze` API 检查当前分析器的分词结果
2. 确认索引是否安装了中文分词插件（如 ik_max_word / ik_smart）
3. 调整 Mapping 中目标字段的 analyzer 设置，重建索引后验证

### Q3: 写入速度慢，bulk 请求超时

**现象**：批量写入响应时间从 100ms 增加到 5s 以上。

**排查步骤**：
1. 检查 `_cat/thread_pool?v&h=name,active,queue,rejected` 确认线程池是否饱和
2. 调整 `refresh_interval` 为 30s 或 -1（关闭自动刷新），写入完成后手动 refresh
3. 增大 bulk 批量大小（建议 5-15MB），减少请求次数降低网络开销

---

## 相关教程

- [MinIO - S3 兼容对象存储](./minio.md)
- [Redis - 分布式缓存](./redis.md)
