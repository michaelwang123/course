---
title: Kubernetes 知识体系
sidebar_position: 1
slug: /middleware/k8s
---

# Kubernetes 知识体系

本文梳理 Kubernetes（K8s）的核心知识脉络，帮助你建立系统性的学习路径。

---

## 一、基础概念

- **容器与容器运行时**：Docker、containerd、CRI-O 的关系
- **K8s 是什么**：容器编排平台，声明式 API + 控制器模式
- **核心设计哲学**：声明式 vs 命令式、期望状态（Desired State）与实际状态（Current State）的调和

---

## 二、集群架构

### 控制面（Control Plane）

- **kube-apiserver**：集群的唯一入口，所有操作通过 REST API
- **etcd**：分布式 KV 存储，保存集群所有状态数据
- **kube-scheduler**：将 Pod 调度到合适的 Node
- **kube-controller-manager**：运行各类控制器（Deployment、ReplicaSet、Node 等）
- **cloud-controller-manager**：对接云厂商 API（负载均衡、存储卷等）

### 工作节点（Node）

- **kubelet**：Node 上的代理，负责 Pod 生命周期管理
- **kube-proxy**：维护网络规则，实现 Service 的负载均衡
- **容器运行时**：containerd / CRI-O

---

## 三、核心资源对象

### 工作负载（Workload）

| 资源 | 用途 |
|------|------|
| Pod | 最小调度单元，一个或多个容器的集合 |
| Deployment | 无状态应用的声明式管理，支持滚动更新与回滚 |
| StatefulSet | 有状态应用管理，保证 Pod 有序创建和稳定网络标识 |
| DaemonSet | 每个 Node 运行一个 Pod 副本（如日志采集、监控 Agent） |
| Job / CronJob | 一次性任务与定时任务 |
| ReplicaSet | 维持 Pod 副本数（通常由 Deployment 管理，不直接使用） |

### 服务发现与网络

| 资源 | 用途 |
|------|------|
| Service | 为一组 Pod 提供稳定的访问入口（ClusterIP / NodePort / LoadBalancer） |
| Ingress | HTTP/HTTPS 层路由规则，将外部流量路由到内部 Service |
| EndpointSlice | Service 背后的 Pod 端点集合 |
| NetworkPolicy | Pod 间网络访问控制（防火墙规则） |

### 配置与存储

| 资源 | 用途 |
|------|------|
| ConfigMap | 存储非敏感配置数据（环境变量、配置文件） |
| Secret | 存储敏感数据（密码、Token、证书） |
| PersistentVolume (PV) | 集群级存储资源 |
| PersistentVolumeClaim (PVC) | Pod 对存储的声明式请求 |
| StorageClass | 定义动态存储供给策略 |

### 调度与扩展

| 资源 | 用途 |
|------|------|
| HPA（Horizontal Pod Autoscaler） | 根据 CPU/内存/自定义指标自动扩缩 Pod 数量 |
| VPA（Vertical Pod Autoscaler） | 自动调整 Pod 的资源请求和限制 |
| PodDisruptionBudget | 限制自愿中断时不可用 Pod 的最大数量 |
| PriorityClass | 定义 Pod 调度优先级 |
| Taint / Toleration | 控制 Pod 能否调度到特定 Node |
| NodeAffinity / PodAffinity | 基于标签的亲和性/反亲和性调度 |

---

## 四、网络模型

- **Pod 网络**：每个 Pod 拥有独立 IP，Pod 间可直接通信
- **CNI 插件**：Calico、Flannel、Cilium、Weave 等实现
- **Service 网络**：ClusterIP → kube-proxy（iptables/IPVS 模式）
- **Ingress Controller**：Nginx Ingress、Traefik、Istio Gateway
- **DNS**：CoreDNS 提供集群内服务发现（`svc.namespace.svc.cluster.local`）

---

## 五、存储体系

- **Volume 类型**：emptyDir、hostPath、nfs、csi
- **CSI（Container Storage Interface）**：标准化存储插件接口
- **动态供给**：StorageClass + Provisioner 自动创建 PV
- **数据持久化策略**：Retain / Delete / Recycle

---

## 六、安全体系

- **认证（Authentication）**：证书、Token、OIDC
- **授权（Authorization）**：RBAC（Role / ClusterRole / RoleBinding）
- **准入控制（Admission Control）**：Webhook、OPA/Gatekeeper
- **Pod 安全**：SecurityContext、PodSecurityAdmission（PSA）
- **网络安全**：NetworkPolicy、mTLS（Service Mesh）
- **Secret 管理**：加密 etcd、外部密钥管理（Vault、Sealed Secrets）

---

## 七、可观测性

- **日志**：stdout/stderr → Fluentd/Fluent Bit → Elasticsearch/Loki
- **监控**：Prometheus + Grafana（kube-state-metrics、node-exporter）
- **链路追踪**：Jaeger、Zipkin、OpenTelemetry
- **事件与审计**：kubectl get events、Audit Log

---

## 八、部署与运维

### 集群安装

- kubeadm（标准部署）
- k3s / k0s（轻量级）
- 云托管：EKS / GKE / AKS / ACK

### 应用发布策略

- 滚动更新（Rolling Update）
- 蓝绿部署（Blue-Green）
- 金丝雀发布（Canary）
- 通过 Argo Rollouts / Flagger 实现渐进式交付

### 配置管理

- Helm Chart：K8s 包管理器
- Kustomize：原生 YAML 叠加定制
- GitOps：ArgoCD / Flux CD

---

## 九、Service Mesh（服务网格）

- **核心概念**：Sidecar 代理、数据面与控制面
- **Istio**：流量管理、安全策略、可观测性
- **Linkerd**：轻量级 Service Mesh
- **关键能力**：mTLS、流量分割、超时重试、熔断

---

## 十、进阶主题

- **Operator 模式**：CRD + 自定义控制器，管理复杂有状态应用
- **多集群管理**：Federation v2、Karmada、Submariner
- **Serverless on K8s**：Knative、OpenFaaS
- **资源配额与限制**：ResourceQuota、LimitRange
- **集群升级**：控制面升级 → Node 逐步升级（drain + uncordon）
- **etcd 运维**：备份恢复、性能调优、集群扩缩容
- **FinOps**：资源利用率分析、Request/Limit 优化、Spot 节点调度

---

## 学习路径建议

```
容器基础 → K8s 架构理解 → 核心资源实操（Pod/Deployment/Service）
→ 配置与存储 → 网络深入 → 安全与 RBAC → 可观测性
→ Helm/GitOps → Service Mesh → Operator 开发
```
