---
title: Retrofit
sidebar_position: 3
slug: /middleware/java-retrofit
---

# Retrofit

## 简介与定位

Retrofit 是 Square 公司开源的类型安全 HTTP 客户端（Type-safe HTTP Client）框架，通过 Java 接口 + 注解的方式声明式定义 REST API，使网络请求像调用本地方法一样自然。它底层委托 [OkHttp](./okhttp.md) 执行实际网络通信，并通过 Converter（转换器）机制自动完成请求体/响应体的序列化与反序列化。相比直接使用 OkHttp 或 [Apache HttpClient](./apache-httpclient.md)，Retrofit 将重复的请求构建、响应解析工作抽象为注解声明，代码更简洁且类型安全。

## Maven 坐标

```xml
<!-- Retrofit 核心库 -->
<dependency>
    <groupId>com.squareup.retrofit2</groupId>
    <artifactId>retrofit</artifactId>
    <version>2.11.0</version>
</dependency>

<!-- Gson 转换器：自动将 JSON 响应转为 Java 对象 -->
<dependency>
    <groupId>com.squareup.retrofit2</groupId>
    <artifactId>converter-gson</artifactId>
    <version>2.11.0</version>
</dependency>
```

## 核心功能与 API 速查

| API / 注解 | 用途说明 |
|------------|---------|
| `@GET` / `@POST` / `@PUT` / `@DELETE` | 声明 HTTP 请求方法及相对路径 |
| `@Path` | 动态替换 URL 路径中的占位符参数 |
| `@Query` / `@QueryMap` | 添加 URL 查询参数，支持单个或批量传递 |
| `@Body` | 将 Java 对象序列化为 JSON 请求体 |
| `Retrofit.Builder` | 构造 Retrofit 实例，配置 baseUrl、Converter 和 CallAdapter |

## 实战代码示例

### 示例一：定义接口并发起 GET 请求

```java
import retrofit2.*;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.http.*;
import java.util.List;

// 定义 API 接口，每个方法对应一个 HTTP 端点
public interface UserApi {
    // 通过 @Query 注解添加分页查询参数
    @GET("users")
    Call<List<User>> getUsers(@Query("page") int page);

    // @Path 替换 URL 中的 {id} 占位符
    @GET("users/{id}")
    Call<User> getUserById(@Path("id") long id);
}

// 构建 Retrofit 实例并调用接口
Retrofit retrofit = new Retrofit.Builder()
        .baseUrl("https://api.example.com/v1/")
        .addConverterFactory(GsonConverterFactory.create())
        .build();

UserApi api = retrofit.create(UserApi.class);
// 同步执行请求获取用户列表
Response<List<User>> response = api.getUsers(1).execute();
```

### 示例二：POST 请求与异步回调

```java
import retrofit2.*;
import retrofit2.http.*;

public interface OrderApi {
    // @Body 将对象自动序列化为 JSON 请求体
    @POST("orders")
    Call<OrderResult> createOrder(@Body OrderRequest req);
}

// 异步调用：不阻塞当前线程，通过回调处理结果
api.createOrder(new OrderRequest("P-001", 2))
   .enqueue(new Callback<OrderResult>() {
       @Override
       public void onResponse(Call<OrderResult> call, Response<OrderResult> resp) {
           // 请求成功，处理响应数据
           System.out.println("订单ID: " + resp.body().getOrderId());
       }
       @Override
       public void onFailure(Call<OrderResult> call, Throwable t) {
           // 网络异常处理
           System.err.println("请求失败: " + t.getMessage());
       }
   });
```

### 示例三：自定义 OkHttpClient 配置拦截器

```java
import okhttp3.*;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import java.util.concurrent.TimeUnit;

// 配置自定义 OkHttpClient 注入 Retrofit，统一管理网络层行为
OkHttpClient client = new OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .addInterceptor(chain -> {
            // 拦截器为每个请求自动添加认证 Token
            Request req = chain.request().newBuilder()
                    .header("Authorization", "Bearer xxx")
                    .build();
            return chain.proceed(req);
        })
        .build();

// 将自定义 client 传入 Retrofit，共享连接池和拦截器
Retrofit retrofit = new Retrofit.Builder()
        .baseUrl("https://api.example.com/v1/")
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build();
```

## 使用心得与踩坑经验

1. **baseUrl 必须以 `/` 结尾**：否则路径拼接会丢失最后一段，导致 404。同时 `@GET` 中的路径不要以 `/` 开头，否则会从根路径解析忽略 baseUrl 路径部分。

2. **Call 对象只能执行一次**：调用 `execute()` 或 `enqueue()` 后不能复用，重试时须调用 `call.clone()` 获取新实例，否则抛出 `IllegalStateException`。

## 适用场景建议

### ✅ 推荐场景

1. **Android 应用网络层**：Retrofit 是 Android 网络请求的事实标准，与 Kotlin 协程、RxJava 无缝集成，配合 OkHttp 拦截器可优雅处理认证、缓存等横切关注点。

2. **微服务间 REST API 调用**：声明式接口定义让 API 契约清晰可读，调用方和提供方基于同一份接口开发，减少沟通成本，体验类似 Spring Cloud OpenFeign。

### ❌ 不推荐场景

1. **非 REST 协议通信**：Retrofit 专为 REST 设计，不适用于 WebSocket、gRPC、GraphQL 等场景。WebSocket 应直接用 [OkHttp](./okhttp.md)，gRPC 应使用 grpc-java。

## HTTP 客户端库对比

| 名称 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **OkHttp** | 高性能连接池；拦截器灵活；支持 HTTP/2 和 WebSocket | 需手动处理 JSON 序列化；无声明式 API 定义 | 底层网络控制；WebSocket；高性能中间件 |
| **Apache HttpClient** | 功能全面覆盖 HTTP 协议所有特性；企业级稳定性 | API 冗长繁琐；依赖体积大；学习曲线陡峭 | 企业级后端调用；复杂认证方案 |
| **Retrofit** | 声明式接口简洁优雅；自动序列化；类型安全 | 仅支持 REST 风格；依赖 OkHttp；非标准响应适配成本高 | Android 网络层；REST 客户端封装；微服务间调用 |

---

## 相关教程

- [OkHttp - 高性能 HTTP 客户端](./okhttp.md)
- [Apache HttpClient - 企业级 HTTP 通信库](./apache-httpclient.md)
