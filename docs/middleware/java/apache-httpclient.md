---
title: Apache HttpClient
sidebar_position: 2
slug: /middleware/java-apache-httpclient
---

# Apache HttpClient

## 简介与定位

Apache HttpClient 是 Apache 基金会维护的 Java HTTP 客户端库，提供完整的 HTTP/1.1 和 HTTP/2 协议实现。相比 [OkHttp](./okhttp.md) 的轻量现代风格，HttpClient 在连接管理、认证机制和企业级特性上更为成熟，是传统 Java 企业项目中最广泛使用的 HTTP 通信方案。

## Maven 坐标

```xml
<dependency>
    <groupId>org.apache.httpcomponents.client5</groupId>
    <artifactId>httpclient5</artifactId>
    <version>5.3.1</version>
</dependency>
```

## 核心功能与 API 速查

| API / 功能 | 用途说明 |
|------------|---------|
| `HttpClients.createDefault()` | 创建默认配置的 CloseableHttpClient 实例 |
| `HttpGet / HttpPost` | 构造 GET/POST 请求对象，设置 URI 和请求头 |
| `CloseableHttpClient.execute()` | 执行 HTTP 请求并返回响应对象 |
| `EntityUtils.toString()` | 将响应体 HttpEntity 转为字符串 |
| `PoolingHttpClientConnectionManager` | 连接池（Connection Pool）管理器，控制并发连接数 |

## 实战代码示例

### 示例一：GET 请求

```java
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.EntityUtils;

public class GetDemo {
    public static void main(String[] args) throws Exception {
        // 创建默认的 HttpClient 实例，内置连接池和重试机制
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpGet request = new HttpGet("https://httpbin.org/get");
            // 设置请求头，模拟浏览器 User-Agent
            request.setHeader("User-Agent", "MyApp/1.0");

            String body = client.execute(request, response ->
                    EntityUtils.toString(response.getEntity()));
            System.out.println("响应内容: " + body);
        }
    }
}
```

### 示例二：POST JSON 请求

```java
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;

public class PostDemo {
    public static void main(String[] args) throws Exception {
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpPost post = new HttpPost("https://httpbin.org/post");
            // 构造 JSON 请求体并设置 Content-Type
            String json = "{\"name\":\"test\",\"age\":25}";
            post.setEntity(new StringEntity(json, ContentType.APPLICATION_JSON));

            // 执行请求并提取响应体字符串
            String result = client.execute(post, response ->
                    EntityUtils.toString(response.getEntity()));
            System.out.println("POST 响应: " + result);
        }
    }
}
```

### 示例三：自定义连接池配置

```java
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.core5.util.Timeout;

public class PoolDemo {
    public static void main(String[] args) {
        // 配置连接池：最大连接数 200，每个路由最大 50
        PoolingHttpClientConnectionManager cm = new PoolingHttpClientConnectionManager();
        cm.setMaxTotal(200);
        cm.setDefaultMaxPerRoute(50);

        // 设置请求超时时间，避免长时间阻塞
        RequestConfig config = RequestConfig.custom()
                .setResponseTimeout(Timeout.ofSeconds(5))
                .setConnectionRequestTimeout(Timeout.ofSeconds(3))
                .build();

        CloseableHttpClient client = HttpClients.custom()
                .setConnectionManager(cm)
                .setDefaultRequestConfig(config)
                .build();
        System.out.println("连接池客户端创建成功");
    }
}
```

## 使用心得与踩坑经验

**连接池泄漏**：务必确保响应体被完整消费或关闭，否则连接不会归还池中，高并发下很快耗尽连接导致请求阻塞。使用 `EntityUtils.consume()` 或 try-with-resources 模式。

**超时必须显式设置**：默认无超时限制，生产环境不设置超时会导致线程长期挂起。建议 connectTimeout、responseTimeout、connectionRequestTimeout 三个值都明确配置。

## 适用场景建议

### ✅ 推荐使用

1. **企业级后端服务间调用**：连接池管理成熟、支持复杂认证（NTLM、Kerberos），适合对稳定性要求高的内部系统通信。

2. **需要精细控制 HTTP 行为的场景**：如自定义重试策略、代理配置、Cookie 管理等，HttpClient 提供的配置粒度远超轻量级库。

### ❌ 不推荐使用

1. **Android 或轻量级项目**：API 较重，依赖体积大。移动端或简单项目推荐使用 [OkHttp](./okhttp.md)，若需声明式调用可选 [Retrofit](./retrofit.md)。

---

## 相关教程

- [OkHttp - 现代 HTTP 客户端](./okhttp.md)
- [Retrofit - 声明式 HTTP 框架](./retrofit.md)
