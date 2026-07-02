---
title: MinIO
sidebar_position: 2
slug: /middleware/minio
---

# MinIO

## 简介与定位

MinIO 是一款高性能的分布式对象存储（Object Storage）系统，完全兼容 Amazon S3 API 协议。它以其轻量部署和卓越的吞吐性能著称，在微服务架构中承担着**非结构化数据的统一存储层**角色，为文件上传下载、图片处理、日志归档等场景提供 S3 兼容的存储服务。

**典型使用场景：**

1. **文件与媒体资源存储**：为微服务提供统一的文件存储入口，处理用户上传的图片、视频、文档等非结构化数据，通过预签名 URL（Presigned URL）实现安全的客户端直传。
2. **数据备份与归档**：作为数据库备份文件、日志归档的存储后端，利用生命周期规则（Lifecycle Policy）实现冷热数据分层，降低存储成本。

## 架构原理图解

```
┌─────────────────────────────────────────────────┐
│              应用服务层                           │
│   (通过 S3 SDK 访问，兼容 AWS S3 API)           │
└─────────────────────┬───────────────────────────┘
                      │ HTTP/HTTPS (端口 9000)
                      ▼
┌─────────────────────────────────────────────────┐
│              MinIO Server                        │
│  ┌───────────────────────────────────────────┐  │
│  │           S3 API Gateway                  │  │
│  │      (兼容 PutObject/GetObject 等)        │  │
│  └───────────────────┬───────────────────────┘  │
│                      │                          │
│  ┌───────────────────▼───────────────────────┐  │
│  │         Erasure Coding (纠删码)           │  │
│  │    数据分块 + 奇偶校验 → 容错恢复          │  │
│  └───────────────────┬───────────────────────┘  │
│                      │                          │
│  ┌───────────────────▼───────────────────────┐  │
│  │          磁盘存储层 (多磁盘分布)           │  │
│  │   /data1   /data2   /data3   /data4       │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│         MinIO Console (管理界面 :9001)           │
│         Bucket 管理 / 用户权限 / 监控            │
└─────────────────────────────────────────────────┘
```

## 部署方式

### Docker Compose 部署

```yaml
version: "3.8"
services:
  minio:
    image: minio/minio:RELEASE.2024-03-15T01-07-19Z
    container_name: minio-server
    ports:
      - "9000:9000"   # S3 API 端口
      - "9001:9001"   # Console 管理界面
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  minio_data:
```

### 就绪验证命令

```bash
# 检查 MinIO 服务健康状态
curl -s http://localhost:9000/minio/health/live
# 预期输出为空（HTTP 200）

# 使用 mc 客户端验证连接
docker exec minio-server mc alias set local http://localhost:9000 minioadmin minioadmin123
docker exec minio-server mc admin info local
```

## 核心概念与术语

| 术语 | 说明 |
|------|------|
| Bucket（桶） | 对象的顶层容器，类似文件系统的目录，每个 Bucket 有独立的访问策略和生命周期配置 |
| Object（对象） | 存储的基本单元，由 Key（路径名）、Data（数据体）和 Metadata（元数据）组成 |
| Presigned URL（预签名URL） | 带有临时访问凭证的 URL，允许客户端在无 SDK 的情况下直接上传或下载文件 |
| Erasure Coding（纠删码） | MinIO 的数据保护机制，将数据分成数据块和校验块，允许部分磁盘故障时恢复数据 |
| Policy（访问策略） | 基于 JSON 的权限规则，控制用户或服务对 Bucket/Object 的读写权限 |
| Lifecycle Rule（生命周期规则） | 自动管理对象的保留和删除，如 30 天后自动删除临时文件 |
| Multipart Upload（分片上传） | 将大文件拆分成多个 Part 并行上传，支持断点续传，适用于 100MB 以上的文件 |

## Java/Go 客户端接入示例

### Java 接入（MinIO Java SDK）

```java
import io.minio.*;
import io.minio.http.Method;

import java.io.InputStream;
import java.util.concurrent.TimeUnit;

public class MinioService {
    private final MinioClient minioClient;

    public MinioService() {
        // 初始化 MinIO 客户端，配置服务端地址和访问凭证
        this.minioClient = MinioClient.builder()
            .endpoint("http://localhost:9000")
            .credentials("minioadmin", "minioadmin123")
            .build();
    }

    // 上传文件到指定 Bucket，自动创建 Bucket（如不存在）
    public void uploadFile(String bucket, String objectName, InputStream stream, long size) throws Exception {
        boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!exists) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
        }
        // 执行上传操作，指定内容类型
        minioClient.putObject(PutObjectArgs.builder()
            .bucket(bucket)
            .object(objectName)
            .stream(stream, size, -1)
            .contentType("application/octet-stream")
            .build());
    }

    // 生成预签名下载链接，有效期 1 小时
    public String getPresignedUrl(String bucket, String objectName) throws Exception {
        return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
            .method(Method.GET)
            .bucket(bucket)
            .object(objectName)
            .expiry(1, TimeUnit.HOURS)
            .build());
    }
}
```

### Go 接入（minio-go）

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"

    "github.com/minio/minio-go/v7"
    "github.com/minio/minio-go/v7/pkg/credentials"
)

func main() {
    ctx := context.Background()

    // 初始化 MinIO 客户端，useSSL=false 表示使用 HTTP 连接
    client, err := minio.New("localhost:9000", &minio.Options{
        Creds:  credentials.NewStaticV4("minioadmin", "minioadmin123", ""),
        Secure: false,
    })
    if err != nil {
        log.Fatal(err)
    }

    // 上传本地文件到 my-bucket，支持自动 Multipart 分片
    bucketName := "my-bucket"
    objectName := "docs/report.pdf"
    filePath := "./report.pdf"

    file, _ := os.Open(filePath)
    defer file.Close()
    stat, _ := file.Stat()

    // 执行上传，返回文件的版本信息和 ETag
    info, err := client.PutObject(ctx, bucketName, objectName, file, stat.Size(),
        minio.PutObjectOptions{ContentType: "application/pdf"})
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("上传成功: %s, 大小: %d bytes\n", info.Key, info.Size)
}
```

## 生产环境注意事项

- **纠删码配置**：生产环境至少使用 4 块磁盘启动 MinIO，纠删码默认允许 N/2 块磁盘故障后数据仍可恢复。建议 8 磁盘或以上配置以获得更好的容错性和性能。
- **HTTPS 与访问控制**：务必启用 TLS 加密传输，并为不同业务创建独立的 Access Key 和细粒度的 Policy，避免使用 Root 凭证直接访问。
- **存储容量监控**：配置磁盘用量告警（阈值 80%），MinIO 在磁盘满时会拒绝写入请求。结合 Lifecycle Rule 自动清理过期文件，防止存储空间耗尽。

## 常见问题与排查经验

### Q1: 上传大文件报 "Insufficient data" 或超时

**现象**：上传超过 100MB 的文件时请求超时或返回错误。

**排查步骤**：
1. 确认客户端是否启用了 Multipart Upload（大文件应分片上传而非单次 PUT）
2. 检查网络带宽和 Nginx/网关的 `client_max_body_size` 限制
3. 适当增大客户端超时时间，调整分片大小（建议 64-128MB/part）

### Q2: 通过预签名 URL 访问报 403 Forbidden

**现象**：生成的 Presigned URL 在浏览器中访问返回 `AccessDenied`。

**排查步骤**：
1. 确认 URL 是否过期（检查 `X-Amz-Expires` 参数）
2. 检查 Bucket Policy 是否允许匿名读取，或预签名时使用的凭证是否有对应权限
3. 确认 MinIO 服务器时间与客户端时间差在 15 分钟以内（S3 签名对时间敏感）

### Q3: 纠删码恢复失败，数据不可读

**现象**：部分对象读取报错 `Storage resources are insufficient`。

**排查步骤**：
1. 使用 `mc admin heal` 检查并修复损坏的数据块
2. 确认故障磁盘数量未超过纠删码的容错上限（默认为总磁盘数的一半）
3. 更换故障磁盘后执行 `mc admin heal --recursive` 重建数据

---

## 相关教程

- [Elasticsearch - 分布式搜索引擎](./elasticsearch.md)
- [Redis - 分布式缓存](./redis.md)
