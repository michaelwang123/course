---
title: Lombok
sidebar_position: 4
slug: /middleware/java-lombok
---

# Lombok

## 简介与定位

Lombok 是一个 Java 编译期注解处理器（Annotation Processor），通过在编译阶段自动生成样板代码（Boilerplate Code）来大幅减少 Java 项目中的重复代码量。它与传统工具库不同——不提供运行时方法调用，而是通过注解在 `.class` 文件中插入 getter/setter、构造器、equals/hashCode、toString 等方法的字节码。

与同类方案的差异：相比 IDE 自动生成代码（需要手动维护）和 Java 14+ 的 Record 类型（功能受限），Lombok 提供了更灵活、更全面的代码生成能力，适用于 Java 8 到 Java 21 的全版本范围。

## Maven 坐标

```xml
<!-- Lombok Maven 依赖配置 -->
<!-- scope 设置为 provided，因为 Lombok 仅在编译期生效 -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.30</version>
    <scope>provided</scope>
</dependency>
```

> **注意**：使用 Lombok 需要在 IDE 中安装对应插件。IntelliJ IDEA 2020.3+ 已内置 Lombok 支持，无需额外安装。

## 核心功能与 API 速查

| 注解 | 用途说明 |
|------|---------|
| `@Data` | 自动生成 getter、setter、toString、equals、hashCode 和 RequiredArgsConstructor |
| `@Builder` | 为类生成 Builder 模式（建造者模式）的构建器，支持链式调用创建对象 |
| `@Slf4j` | 自动生成 SLF4J 日志对象 `private static final Logger log`，免去手动声明 |
| `@NoArgsConstructor` / `@AllArgsConstructor` | 自动生成无参构造器或全参构造器 |
| `@Getter` / `@Setter` | 在类或字段级别生成 getter/setter 方法，支持指定访问级别 |
| `@ToString` | 生成 toString 方法，可通过 `exclude` 排除敏感字段 |
| `@EqualsAndHashCode` | 生成 equals 和 hashCode 方法，支持 `callSuper` 处理继承关系 |
| `@Value` | 不可变类注解，等效于 `@Data` + final 字段 + 无 setter，适合定义 VO（Value Object） |
| `@SneakyThrows` | 将受检异常（Checked Exception）包装为非受检异常抛出，简化异常处理 |
| `@Cleanup` | 自动在作用域结束时调用资源的 close 方法，类似 try-with-resources |

## 实战代码示例

### 示例一：使用 @Data 简化 POJO 类

```java
import lombok.Data;

// 使用 @Data 注解自动生成所有样板代码
// 编译后会自动包含 getter、setter、toString、equals、hashCode 方法
@Data
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private Integer age;

    // 无需手写任何 getter/setter/toString
    // 编译器会在 class 文件中自动生成这些方法
}

// 使用方式与手写 getter/setter 完全一致
// UserDTO user = new UserDTO();
// user.setUsername("张三");
// System.out.println(user); // 自动调用生成的 toString
```

### 示例二：使用 @Builder 实现链式构建

```java
import lombok.Builder;
import lombok.Data;
import lombok.ToString;

// @Builder 生成建造者模式代码，适合参数较多的对象创建
// 配合 @ToString 方便调试时打印对象内容
@Data
@Builder
@ToString
public class OrderRequest {
    private String orderId;
    private String productName;
    private Integer quantity;
    private Double price;
    private String shippingAddress;
    private String remark;
}

// 使用 Builder 链式创建对象，代码可读性远优于多参数构造器
// OrderRequest order = OrderRequest.builder()
//         .orderId("ORD-20240101")
//         .productName("Java编程思想")
//         .quantity(2)
//         .price(99.0)
//         .shippingAddress("北京市海淀区")
//         .build();
```

### 示例三：使用 @Slf4j 与 @SneakyThrows 简化日志与异常

```java
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import java.nio.file.Files;
import java.nio.file.Path;

// @Slf4j 自动生成 log 对象，无需手动声明 LoggerFactory.getLogger(...)
// 这是项目中最常用的注解之一，几乎每个 Service 类都会使用
@Slf4j
public class FileService {

    // @SneakyThrows 自动处理受检异常，避免方法签名中声明 throws
    // 注意：仅建议在确定异常不会发生或顶层调用处使用
    @SneakyThrows
    public String readFileContent(String filePath) {
        log.info("开始读取文件: {}", filePath);

        // Files.readString 会抛出 IOException，但 @SneakyThrows 帮我们处理了
        String content = Files.readString(Path.of(filePath));

        log.debug("文件读取完成，内容长度: {} 字符", content.length());
        return content;
    }
}
```

### 示例四：使用 @Value 创建不可变对象

```java
import lombok.Value;
import java.time.LocalDateTime;

// @Value 创建不可变（Immutable）对象，所有字段自动为 private final
// 适合用作配置项、事件对象、缓存 Key 等不需要修改的场景
@Value
public class CacheKey {
    String module;
    String bizId;
    LocalDateTime createTime;

    // 编译后自动生成：全参构造器、getter（无setter）、equals、hashCode、toString
    // 由于字段是 final 的，该对象天然线程安全
}
```

## 使用心得与踩坑经验

### 踩坑一：@Data 与 JPA/Hibernate 实体的循环引用

在使用 `@Data` 注解 JPA 实体类时，如果两个实体之间存在双向关联（如 `Order` 和 `OrderItem`），自动生成的 `toString()` 和 `hashCode()` 方法会触发无限递归，最终导致 `StackOverflowError`。这是项目中最常见的 Lombok 踩坑点之一。正确的做法是使用 `@ToString.Exclude` 和 `@EqualsAndHashCode.Exclude` 注解排除关联字段，或者直接使用 `@Getter`/`@Setter` 替代 `@Data`，手动控制 `toString` 和 `equals` 的实现逻辑。在实际的大型微服务项目中，我们团队最终约定：JPA 实体类一律不使用 `@Data`，改用组合注解 `@Getter` + `@Setter` + `@NoArgsConstructor`，需要打印日志时手动编写 `toString` 方法只包含必要字段。

### 踩坑二：@Builder 与默认值丢失问题

使用 `@Builder` 时，如果字段在类中声明了默认值（如 `private Integer status = 0`），通过 Builder 构建对象时这些默认值不会生效——因为 Builder 会使用自己的内部状态初始化字段。解决方案是在字段上添加 `@Builder.Default` 注解，显式告知 Lombok 保留该字段的默认值。这个问题在新手使用 Lombok 时极易被忽略，往往导致生产环境出现字段值为 null 的 Bug，排查时因为看不到生成的代码而更加困难。建议团队在代码审查时重点关注使用了 `@Builder` 的类中是否有带默认值的字段未加 `@Builder.Default` 注解。

### 踩坑三：Lombok 版本与 JDK 版本兼容性

升级 JDK 版本时（尤其是 JDK 16+ 引入的强封装模块系统），旧版本 Lombok 可能无法正常工作，编译时会报 `IllegalAccessError` 或 `module java.base does not open java.lang to unnamed module` 错误。务必在升级 JDK 后第一时间检查 Lombok 版本兼容性，建议始终使用最新稳定版（当前为 1.18.30+）。可通过 Lombok 官网的版本兼容矩阵确认支持情况。

## 适用场景建议

### ✅ 推荐使用

- **DTO/VO/Request/Response 等数据传输对象**：这些类通常有大量字段但逻辑简单，使用 `@Data` 或 `@Value` 可节省 70% 以上的样板代码，提升代码可维护性
- **Service 层日志声明**：几乎所有 Service/Controller 类都需要日志对象，`@Slf4j` 是投入产出比最高的注解，一行注解替代一行冗长的 LoggerFactory 声明
- **参数较多的配置类或请求体**：使用 `@Builder` 创建对象比多参数构造器或连续 setter 调用更清晰、更不容易出错，配合 [Guava](./guava.md) 的 Preconditions 做参数校验效果更佳

### ❌ 不推荐使用

- **核心领域模型（Domain Model）中过度使用 @Data**：领域模型的 equals/hashCode 逻辑通常需要精心设计（比如基于业务 ID 而非全字段），`@Data` 的全字段比较语义不适合此场景。建议参考 [Apache Commons Lang3](./apache-commons.md) 的 `EqualsBuilder`/`HashCodeBuilder` 进行精细化控制，或使用 [Hutool](./hutool.md) 的 BeanUtil 做对象拷贝时同样需注意此问题

---

## 相关教程

- [Guava 教程](./guava.md) — Google 核心 Java 工具库，提供集合、缓存、并发等增强工具
- [Apache Commons 教程](./apache-commons.md) — Apache 基础工具库套件，覆盖字符串、集合、IO 操作
- [Hutool 教程](./hutool.md) — 国产全能型 Java 工具库，API 风格简洁易用
