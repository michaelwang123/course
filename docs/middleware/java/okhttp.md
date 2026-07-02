---
title: OkHttp
sidebar_position: 1
slug: /middleware/java-okhttp
---

# OkHttp

## 简介与定位

OkHttp 是由 Square 公司开发的高性能 HTTP 客户端库，支持 HTTP/1.1 和 HTTP/2 协议。它内置连接池（Connection Pool）复用、透明 GZIP 压缩、请求重试与重定向等特性，是 Android 官方推荐的网络库，也广泛应用于 Java 后端服务间调用。相比 [Apache HttpClient](./apache-httpclient.md) 的重量级设计，OkHttp API 更简洁现代；[Retrofit](./retrofit.md) 则是基于 OkHttp 的声明式封装。

## Maven 坐标

```xml
<dependency>
    <groupId>com.squareup.okhttp3</groupId>
    <artifactId>okhttp</artifactId>
    <version>4.12.0</version>
</dependency>
```

## 核心功能与 API 速查

| API / 功能 | 用途说明 |
|------------|---------|
| `OkHttpClient` | HTTP 客户端入口，管理连接池、超时、拦截器等全局配置 |
| `Request.Builder` | 构造 HTTP 请求，支持 GET/POST/PUT/DELETE 等方法 |
| `Call.execute()` | 同步执行请求，阻塞当前线程直到响应返回 |
| `Call.enqueue()` | 异步执行请求，通过 Callback 回调处理响应 |
| `Interceptor` | 拦截器（Interceptor），用于统一添加请求头、日志记录、重试逻辑等 |

## 实战代码示例

### 示例一：同步 GET 请求

```java
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class OkHttpGetDemo {
    public static void main(String[] args) throws Exception {
        // 创建客户端实例，建议全局复用以利用连接池
        OkHttpClient client = new OkHttpClient();

        // 构建 GET 请求
        Request request = new Request.Builder()
                .url("https://httpbin.org/get")
                .header("Accept", "application/json")
                .build();

        // 同步执行请求并读取响应体
        try (Response response = client.newCall(request).execute()) {
            System.out.println("状态码: " + response.code());
            System.out.println("响应: " + response.body().string());
        }
    }
}
```

### 示例二：POST 提交 JSON 数据

```java
import okhttp3.*;

public class OkHttpPostDemo {
    // 定义 JSON 媒体类型常量
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    public static void main(String[] args) throws Exception {
        OkHttpClient client = new OkHttpClient();

        // 构造 JSON 请求体并发送 POST 请求
        String jsonBody = "{\"username\":\"test\",\"password\":\"123456\"}";
        RequestBody body = RequestBody.create(jsonBody, JSON);

        Request request = new Request.Builder()
                .url("https://httpbin.org/post")
                .post(body)
                .build();

        // 执行请求并输出结果
        try (Response response = client.newCall(request).execute()) {
            System.out.println("响应: " + response.body().string());
        }
    }
}
```

### 示例三：添加拦截器统一处理请求

```java
import okhttp3.*;
import java.io.IOException;

public class OkHttpInterceptorDemo {
    public static void main(String[] args) throws Exception {
        // 通过拦截器为所有请求统一添加认证头
        OkHttpClient client = new OkHttpClient.Builder()
                .addInterceptor(chain -> {
                    Request original = chain.request();
                    // 在每个请求中注入 Token，避免重复代码
                    Request newRequest = original.newBuilder()
                            .header("Authorization", "Bearer my-token")
                            .build();
                    return chain.proceed(newRequest);
                })
                .build();

        Request request = new Request.Builder()
                .url("https://httpbin.org/headers")
                .build();

        try (Response response = client.newCall(request).execute()) {
            System.out.println("响应: " + response.body().string());
        }
    }
}
```

## 使用心得与踩坑经验

### 心得一：OkHttpClient 必须全局复用

每个 `OkHttpClient` 实例内部维护连接池和线程池，频繁创建会导致连接泄漏和资源浪费。正确做法是全局创建一个实例，需要不同配置时使用 `client.newBuilder()` 派生。

### 心得二：响应体必须关闭

调用 `response.body().string()` 后底层连接会自动释放，但如果只读取了部分内容或未消费响应体，必须手动调用 `response.close()`，否则连接池中的连接无法回收，最终耗尽可用连接。

## 适用场景建议

### ✅ 推荐使用的场景

1. **微服务间 HTTP 调用**：OkHttp 的连接池和 HTTP/2 多路复用在高频服务调用场景下表现优异，配合拦截器可统一处理鉴权、链路追踪等横切关注点。

2. **Android 网络请求**：作为 Android 官方推荐的 HTTP 库，OkHttp 针对移动端做了大量优化（如网络切换时的连接恢复）。如果需要更高层的声明式 API，可搭配 [Retrofit](./retrofit.md) 使用。

### ❌ 不推荐使用的场景

1. **需要复杂认证协议的场景**：如 NTLM、Kerberos 等企业级认证协议，OkHttp 不原生支持。此场景下 [Apache HttpClient](./apache-httpclient.md) 提供更完整的认证方案。

---

## 相关教程

- [Apache HttpClient - 经典 HTTP 客户端库](./apache-httpclient.md)
- [Retrofit - 声明式 HTTP 客户端](./retrofit.md)
