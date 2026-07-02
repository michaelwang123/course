---
title: Gson
sidebar_position: 3
slug: /middleware/java-gson
---

# Gson

## 简介与定位

Gson 是 Google 开源的轻量级 JSON 处理库，以"开箱即用、零配置"为核心设计理念。它只需要一个 JAR 依赖即可完成 Java 对象与 JSON 之间的相互转换，没有复杂的模块体系，API 设计简洁直观，非常适合快速上手和中小型项目使用。

与同类库的差异：相比 [Jackson](./jackson.md) 的模块化架构和丰富注解体系，Gson 更追求**极简 API 和零学习成本**——大多数场景下只需一行 `new Gson()` 即可完成序列化/反序列化；相比 [Fastjson2](./fastjson2.md) 对极致性能的追求和 JSONB 等私有协议，Gson 则专注于**标准 JSON 处理的稳定性和跨平台兼容性**，在 Android 开发中尤为流行，是 Google 官方 Retrofit 网络库的默认 JSON 解析器。

## Maven 坐标

```xml
<!-- Gson 单 JAR 即可，无传递依赖 -->
<dependency>
    <groupId>com.google.code.gson</groupId>
    <artifactId>gson</artifactId>
    <version>2.11.0</version>
</dependency>
```

> **提示**：Gson 从 2.9 版本开始要求 Java 8+，如果项目运行在 Android API Level < 26，注意使用兼容的旧版本。

## 核心功能与 API 速查

| API / 功能 | 用途说明 |
|------------|---------|
| `Gson.toJson()` | 将 Java 对象序列化为 JSON 字符串 |
| `Gson.fromJson()` | 将 JSON 字符串反序列化为 Java 对象 |
| `GsonBuilder` | 构造器模式创建自定义配置的 Gson 实例 |
| `TypeToken<T>` | 保留泛型类型信息，用于反序列化泛型集合 |
| `@SerializedName` | 指定字段在 JSON 中的名称映射 |
| `@Expose` | 配合 `excludeFieldsWithoutExposeAnnotation()` 控制字段可见性 |
| `JsonElement` / `JsonObject` / `JsonArray` | JSON 树模型，用于处理动态或未知结构的 JSON |
| `GsonBuilder.registerTypeAdapter()` | 注册自定义序列化/反序列化适配器 |
| `GsonBuilder.setDateFormat()` | 全局配置日期格式化模式 |
| `GsonBuilder.setPrettyPrinting()` | 启用美化输出，方便调试 |

## 实战代码示例

### 示例一：基本序列化与反序列化

```java
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.annotations.SerializedName;

public class GsonBasicDemo {
    public static void main(String[] args) {
        // 创建 Gson 实例，使用 GsonBuilder 启用美化输出和日期格式化
        // Gson 实例是线程安全的，可以复用但创建成本较低
        Gson gson = new GsonBuilder()
                .setPrettyPrinting()
                .setDateFormat("yyyy-MM-dd HH:mm:ss")
                .create();

        // 构造用户对象并序列化为 JSON 字符串
        User user = new User("王五", "wangwu@example.com", 28);

        // 序列化：一行代码完成对象到 JSON 的转换
        String json = gson.toJson(user);
        System.out.println("序列化结果:\n" + json);

        // 反序列化：从 JSON 字符串还原 Java 对象
        String inputJson = "{\"user_name\":\"赵六\",\"email\":\"zhaoliu@example.com\",\"age\":32}";
        User parsed = gson.fromJson(inputJson, User.class);
        System.out.println("反序列化结果: " + parsed.getName());
    }

    static class User {
        // @SerializedName 指定 JSON 字段名与 Java 属性的映射关系
        // 支持 alternate 指定多个备选名称，增强兼容性
        @SerializedName(value = "user_name", alternate = {"username", "userName"})
        private String name;

        private String email;
        private int age;

        public User(String name, String email, int age) {
            this.name = name;
            this.email = email;
            this.age = age;
        }

        public String getName() { return name; }
        public String getEmail() { return email; }
        public int getAge() { return age; }
    }
}
```

### 示例二：泛型集合反序列化与 JsonElement 树模型

```java
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.List;
import java.util.Map;

public class GsonGenericDemo {
    public static void main(String[] args) {
        Gson gson = new Gson();

        // 泛型集合反序列化：使用 TypeToken 解决 Java 泛型擦除问题
        // 不使用 TypeToken 会导致集合元素变成 LinkedTreeMap 而非目标类型
        String listJson = "[{\"id\":1,\"name\":\"Guava\"},{\"id\":2,\"name\":\"Hutool\"}]";
        Type listType = new TypeToken<List<Map<String, Object>>>() {}.getType();
        List<Map<String, Object>> list = gson.fromJson(listJson, listType);
        System.out.println("列表大小: " + list.size());
        System.out.println("第一项名称: " + list.get(0).get("name"));

        // 使用 JsonElement 树模型处理结构不固定的 JSON 数据
        // 适合只需提取部分字段、无需定义完整 POJO 的场景
        String dynamicJson = "{\"code\":200,\"data\":{\"total\":50,\"items\":[\"Redis\",\"Kafka\"]}}";
        JsonObject root = gson.fromJson(dynamicJson, JsonObject.class);

        int code = root.get("code").getAsInt();
        JsonObject data = root.getAsJsonObject("data");
        int total = data.get("total").getAsInt();
        JsonArray items = data.getAsJsonArray("items");

        System.out.println("状态码: " + code);
        System.out.println("总数: " + total);
        System.out.println("第一项: " + items.get(0).getAsString());
    }
}
```

### 示例三：自定义 TypeAdapter 与字段排除策略

```java
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import com.google.gson.annotations.Expose;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class GsonCustomAdapterDemo {
    public static void main(String[] args) {
        // 注册自定义 TypeAdapter 处理 Java 8 日期类型
        // Gson 默认不支持 LocalDate 等新日期 API，需要手动注册适配器
        Gson gson = new GsonBuilder()
                .registerTypeAdapter(LocalDate.class, new LocalDateAdapter())
                .excludeFieldsWithoutExposeAnnotation() // 仅序列化标注了 @Expose 的字段
                .setPrettyPrinting()
                .create();

        // 构建商品对象，演示自定义序列化与字段排除
        Product product = new Product("无线鼠标", 129.9, LocalDate.of(2024, 3, 1), "INTERNAL-SKU-001");
        String json = gson.toJson(product);
        System.out.println("定制序列化结果:\n" + json);

        // 反序列化验证自定义 TypeAdapter 双向生效
        String input = "{\"name\":\"机械键盘\",\"price\":599.0,\"launch_date\":\"2024-06-15\"}";
        Product parsed = gson.fromJson(input, Product.class);
        System.out.println("反序列化日期: " + parsed.getLaunchDate());
    }

    // 自定义 TypeAdapter：处理 LocalDate 的序列化和反序列化
    // 通过流式 API 实现高效的读写操作
    static class LocalDateAdapter extends TypeAdapter<LocalDate> {
        private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

        @Override
        public void write(JsonWriter out, LocalDate value) throws IOException {
            out.value(value != null ? value.format(FORMATTER) : null);
        }

        @Override
        public LocalDate read(JsonReader in) throws IOException {
            String dateStr = in.nextString();
            return LocalDate.parse(dateStr, FORMATTER);
        }
    }

    static class Product {
        @Expose
        private String name;

        @Expose
        private double price;

        @Expose
        @com.google.gson.annotations.SerializedName("launch_date")
        private LocalDate launchDate;

        // 未标注 @Expose，序列化时自动排除（内部编码不对外暴露）
        private String internalSku;

        public Product(String name, double price, LocalDate launchDate, String internalSku) {
            this.name = name;
            this.price = price;
            this.launchDate = launchDate;
            this.internalSku = internalSku;
        }

        public LocalDate getLaunchDate() { return launchDate; }
    }
}
```

### 示例四：Null 值处理与版本控制

```java
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.annotations.Since;
import com.google.gson.annotations.Until;

public class GsonVersionDemo {
    public static void main(String[] args) {
        // 使用 serializeNulls 控制 null 字段是否输出到 JSON
        // 默认 Gson 会忽略 null 字段，某些前端框架需要显式的 null 值
        Gson gsonWithNulls = new GsonBuilder()
                .serializeNulls()
                .setPrettyPrinting()
                .create();

        ApiResponse response = new ApiResponse(200, "success", null);
        System.out.println("包含null值:\n" + gsonWithNulls.toJson(response));

        // 使用 @Since 和 @Until 注解实现 API 版本控制
        // 设置版本号为 2.0，只序列化 version <= 2.0 且未被 @Until 标记过期的字段
        Gson gsonV2 = new GsonBuilder()
                .setVersion(2.0)
                .setPrettyPrinting()
                .create();

        UserProfile profile = new UserProfile("张三", "zhangsan@test.com", "旧头像.png", "新个性签名");
        System.out.println("V2版本序列化:\n" + gsonV2.toJson(profile));
    }

    static class ApiResponse {
        private int code;
        private String message;
        private Object data;

        public ApiResponse(int code, String message, Object data) {
            this.code = code;
            this.message = message;
            this.data = data;
        }
    }

    static class UserProfile {
        @Since(1.0)
        private String name;       // v1.0 引入

        @Since(1.0)
        private String email;      // v1.0 引入

        @Until(2.0)
        private String avatar;     // v2.0 起废弃，不再输出

        @Since(2.0)
        private String signature;  // v2.0 新增字段

        public UserProfile(String name, String email, String avatar, String signature) {
            this.name = name;
            this.email = email;
            this.avatar = avatar;
            this.signature = signature;
        }
    }
}
```

## 使用心得与踩坑经验

### 心得一：Gson 默认不支持 Java 8+ 日期类型，需手动注册 TypeAdapter

这是 Gson 使用中最常见的坑。当实体类中包含 `LocalDateTime`、`LocalDate`、`Instant` 等 Java 8 时间 API 的字段时，直接使用 `new Gson()` 序列化会抛出 `UnsupportedOperationException`，或者输出一个巨大的内部结构对象而非期望的日期字符串。与 Jackson 自动注册 `JavaTimeModule` 或 Fastjson2 天然支持新日期类型不同，Gson 目前没有官方的日期模块扩展，必须开发者自行编写 TypeAdapter 并通过 `GsonBuilder.registerTypeAdapter()` 注册。我在多个 Android 项目中都遇到这个问题，最终抽取了一个公共的 `GsonFactory` 工具类，预注册了 `LocalDate`、`LocalDateTime`、`Instant` 三种常用类型的适配器，团队成员统一使用该工厂方法获取 Gson 实例，彻底杜绝了各模块各自注册导致的行为不一致问题。建议在项目初期就建立这样的统一入口，而非等到线上出了日期格式混乱的 Bug 再去修补。

### 心得二：警惕 Gson 对 Integer/Long 的默认反序列化行为

Gson 在反序列化 JSON 数字到 `Object` 类型或 `Map<String, Object>` 时，会默认将所有数字转为 `Double` 类型。这意味着一个 JSON 中的 `"id": 123456789` 在反序列化后会变成 `1.23456789E8` 的 Double 值，如果你将其作为主键使用或传递给下游服务，就会出现精度丢失或类型不匹配的异常。这在处理第三方 API 返回的动态 JSON 时尤其隐蔽——测试环境的小数字不会暴露问题，到了生产环境遇到大 ID 值才突然崩溃。解决方案是注册一个自定义的 `ObjectTypeAdapter`，将数字类型的判断逻辑改为：优先尝试 Long，无法容纳时再降级为 Double。或者在 GsonBuilder 中使用 `setObjectToNumberStrategy(ToNumberPolicy.LONG_OR_DOUBLE)`（需要 Gson 2.9+），这个新 API 正是为了解决此问题而引入的。

### 心得三：@SerializedName 的 alternate 参数是兼容性利器

在对接多个第三方系统时，同一个语义的字段可能有不同的命名：有的用 `user_name`，有的用 `userName`，还有的用 `username`。Gson 的 `@SerializedName` 注解支持 `alternate` 属性，可以同时指定多个备选名称进行反序列化匹配。这比为每个数据源定义不同的 DTO 类要优雅得多。但注意 alternate 只在反序列化时生效，序列化输出仍使用 `value` 中指定的主名称。

## 适用场景建议

### ✅ 推荐使用的场景

1. **Android 应用开发**：Gson 是 Android 生态中最常用的 JSON 库，与 [Retrofit](./retrofit.md) 网络框架无缝集成，且包体积极小（约 250KB），不会给 APK 带来明显的体积负担。Android 社区的大量教程和 StackOverflow 解答都基于 Gson，遇到问题容易找到解决方案。

2. **快速原型开发和小型项目**：当你只需要做简单的 JSON 序列化/反序列化，不需要复杂的注解体系或模块系统时，Gson 的 `new Gson()` 一行代码即可开始工作，无需任何配置，学习成本几乎为零。非常适合工具脚本、Demo 项目或教学场景。

3. **需要 API 版本控制的场景**：Gson 内置的 `@Since` 和 `@Until` 注解提供了优雅的字段级版本控制能力，可以用同一个 POJO 类服务不同 API 版本的客户端，减少重复的 DTO 类定义。这在 REST API 的渐进式演进中非常实用。

### ❌ 不推荐使用的场景

1. **Spring Boot 后端服务**：Spring Boot 默认深度集成 [Jackson](./jackson.md)，`@RequestBody`、`@ResponseBody`、`RestTemplate`、WebClient 等组件全部基于 Jackson 实现。在 Spring 项目中使用 Gson 需要额外的适配配置（`HttpMessageConverters`），且会失去 Spring 生态中大量 Jackson 相关的自动配置能力，维护成本反而更高。

2. **高性能服务端场景**：在大规模后端服务的基准测试中，Gson 的序列化/反序列化性能通常落后于 [Jackson](./jackson.md) 和 [Fastjson2](./fastjson2.md)。对于每秒数万次 JSON 操作的网关或数据处理场景，性能差距会被放大为显著的 CPU 和延迟开销。

## JSON 库对比

以下表格对比了 Java 生态中三大主流 JSON 处理库，帮助你根据项目场景做出合理选型：

| 名称 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Jackson** | 功能最全面，Spring 生态默认集成；模块化架构支持 JSON/XML/YAML 多格式；注解体系丰富，定制能力强；社区活跃、文档完善 | 三模块依赖结构较重；高级特性学习曲线陡峭；配置项繁多容易混淆 | Spring Boot 项目首选；需要多格式支持的企业应用；复杂序列化定制需求 |
| **Fastjson2** | 序列化/反序列化性能极致；API 设计简洁直观；支持 JSONB 二进制格式和 JSONPath；中文文档友好 | 历史安全漏洞导致部分企业限制使用；JSONB 为私有协议不跨语言；AutoType 需谨慎配置 | 高并发 Java 服务；阿里系技术栈项目；对 JSON 处理性能有极高要求的场景 |
| **Gson** | 极简 API 零学习成本；单 JAR 无传递依赖；稳定可靠，Google 维护；Android 生态标配 | 不支持 Java 8 日期类型需手动适配；性能不及 Jackson/Fastjson2；功能扩展性有限 | Android 应用开发；快速原型和小型项目；Retrofit 配合使用；简单 JSON 处理场景 |

---

## 相关教程

- [Jackson - Java 生态标准 JSON 库](./jackson.md)
- [Fastjson2 - 高性能 JSON 处理库](./fastjson2.md)
