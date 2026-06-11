import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, RoundedBox, Line } from '@react-three/drei';
import * as THREE from 'three';

// ======================== 类型定义 ========================

/** 车辆指标数据类型 */
export interface TruckMetrics {
  speed?: string;
  fuelLevel?: string;
  loadWeight?: string;
  engine?: string;
  mileage?: string;
  tireStatus?: string;
  emission?: string;
  brakeTemp?: string;
  cargoTemp?: string;
  suspension?: string;
  tirePressureFL?: string;
  tirePressureFR?: string;
  tirePressureRL?: string;
  tirePressureRR?: string;
}

/** 指标状态 */
type MetricStatus = 'normal' | 'warning' | 'danger';

/** 标注层级 */
type AnnotationLevel = 'L1' | 'L2' | 'L3';

/** 标注区域 */
type AnnotationZone = 'top' | 'cab' | 'trailer' | 'bottom';

/** 标注点配置 */
interface AnnotationPoint {
  id: string;
  anchorPosition: [number, number, number]; // 模型上的锚点
  labelOffset: [number, number, number];    // 标签偏移（引导线终点）
  label: string;
  metricKey: keyof TruckMetrics;
  level: AnnotationLevel;
  zone: AnnotationZone;
  getStatus?: (value: string) => MetricStatus;
}

// ======================== 配置 ========================

const STATUS_COLORS: Record<MetricStatus, { border: string; bg: string; text: string }> = {
  normal: { border: 'rgba(59, 130, 246, 0.6)', bg: 'rgba(10, 20, 40, 0.92)', text: '#e2e8f0' },
  warning: { border: 'rgba(245, 158, 11, 0.8)', bg: 'rgba(40, 25, 5, 0.92)', text: '#fbbf24' },
  danger: { border: 'rgba(239, 68, 68, 0.8)', bg: 'rgba(40, 10, 10, 0.92)', text: '#f87171' },
};

/** 标注点定义 */
const ANNOTATIONS: AnnotationPoint[] = [
  // L1 - 核心状态（顶部悬浮）
  {
    id: 'speed',
    anchorPosition: [3.2, 2.8, 0],
    labelOffset: [3.2, 3.8, 0],
    label: '速度',
    metricKey: 'speed',
    level: 'L1',
    zone: 'top',
  },
  {
    id: 'fuel',
    anchorPosition: [1.0, 0.0, 1.0],
    labelOffset: [1.0, 3.8, 0],
    label: '油量',
    metricKey: 'fuelLevel',
    level: 'L1',
    zone: 'top',
    getStatus: (v) => {
      const num = parseInt(v);
      if (num <= 15) return 'danger';
      if (num <= 30) return 'warning';
      return 'normal';
    },
  },
  {
    id: 'load',
    anchorPosition: [-2.2, 1.6, 0],
    labelOffset: [-1.2, 3.8, 0],
    label: '载重',
    metricKey: 'loadWeight',
    level: 'L1',
    zone: 'top',
    getStatus: (v) => {
      const match = v.match(/(\d+\.?\d*)\s*吨\s*\/\s*(\d+\.?\d*)/);
      if (match) {
        const ratio = parseFloat(match[1]) / parseFloat(match[2]);
        if (ratio >= 0.95) return 'danger';
        if (ratio >= 0.8) return 'warning';
      }
      return 'normal';
    },
  },

  // L2 - 运维信息（驾驶室区域）
  {
    id: 'engine',
    anchorPosition: [2.5, 1.0, 0],
    labelOffset: [4.5, 1.5, 1.8],
    label: '发动机',
    metricKey: 'engine',
    level: 'L2',
    zone: 'cab',
  },
  {
    id: 'mileage',
    anchorPosition: [2.2, 0.3, 0],
    labelOffset: [4.5, 0.3, 1.8],
    label: '里程',
    metricKey: 'mileage',
    level: 'L2',
    zone: 'cab',
  },
  {
    id: 'emission',
    anchorPosition: [1.5, 2.8, -1.2],
    labelOffset: [1.5, 3.2, -2.5],
    label: '排放',
    metricKey: 'emission',
    level: 'L2',
    zone: 'cab',
  },

  // L2 - 运维信息（货箱区域）
  {
    id: 'cargoTemp',
    anchorPosition: [-2.2, 2.0, 0],
    labelOffset: [-4.5, 2.5, 1.8],
    label: '货物温度',
    metricKey: 'cargoTemp',
    level: 'L2',
    zone: 'trailer',
  },

  // L2 - 行驶系统（底部）
  {
    id: 'tire',
    anchorPosition: [0.5, -0.35, 1.1],
    labelOffset: [0.5, -1.5, 2.5],
    label: '轮胎状态',
    metricKey: 'tireStatus',
    level: 'L2',
    zone: 'bottom',
    getStatus: (v) => {
      if (v.includes('更换') || v.includes('异常')) return 'danger';
      if (v.includes('磨损') || v.includes('注意')) return 'warning';
      return 'normal';
    },
  },
  {
    id: 'brake',
    anchorPosition: [-3.0, -0.35, 1.1],
    labelOffset: [-3.0, -1.5, 2.5],
    label: '刹车温度',
    metricKey: 'brakeTemp',
    level: 'L2',
    zone: 'bottom',
    getStatus: (v) => {
      const num = parseInt(v);
      if (num >= 400) return 'danger';
      if (num >= 300) return 'warning';
      return 'normal';
    },
  },
  {
    id: 'suspension',
    anchorPosition: [-1.5, -0.1, 0],
    labelOffset: [-1.5, -1.5, -2.5],
    label: '悬挂',
    metricKey: 'suspension',
    level: 'L2',
    zone: 'bottom',
  },
];

// ======================== 子组件 ========================

/** 引导线 + 标签 */
function AnnotationMarker({
  annotation,
  value,
  visible,
  status,
}: {
  annotation: AnnotationPoint;
  value: string;
  visible: boolean;
  status: MetricStatus;
}) {
  const colors = STATUS_COLORS[status];

  if (!visible) return null;

  const linePoints: [number, number, number][] = [
    annotation.anchorPosition,
    annotation.labelOffset,
  ];

  return (
    <group>
      {/* 锚点标记 */}
      <mesh position={annotation.anchorPosition}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial
          color={status === 'normal' ? '#3b82f6' : status === 'warning' ? '#f59e0b' : '#ef4444'}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* 锚点光晕 */}
      <mesh position={annotation.anchorPosition}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshBasicMaterial
          color={status === 'normal' ? '#3b82f6' : status === 'warning' ? '#f59e0b' : '#ef4444'}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* 引导线 */}
      <Line
        points={linePoints}
        color={status === 'normal' ? '#3b82f6' : status === 'warning' ? '#f59e0b' : '#ef4444'}
        lineWidth={1}
        dashed
        dashSize={0.1}
        gapSize={0.05}
        transparent
        opacity={0.6}
      />

      {/* 标签 */}
      <Html
        position={annotation.labelOffset}
        distanceFactor={10}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: colors.bg,
            color: colors.text,
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            border: `1px solid ${colors.border}`,
            backdropFilter: 'blur(6px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transition: 'opacity 0.3s ease',
          }}
        >
          <div
            style={{
              color: status === 'normal' ? '#93c5fd' : status === 'warning' ? '#fcd34d' : '#fca5a5',
              fontSize: '9px',
              marginBottom: 2,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 500,
            }}
          >
            {annotation.label}
          </div>
          <div style={{ fontWeight: 600, fontSize: '12px' }}>{value}</div>
        </div>
      </Html>
    </group>
  );
}

/** 高精度轮胎组件 */
function DetailedWheel({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.32, 0.12, 16, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.22, 24]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.24, 12]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh key={i} position={[Math.cos(rad) * 0.14, Math.sin(rad) * 0.14, 0.12]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#666" metalness={0.9} roughness={0.2} />
          </mesh>
        );
      })}
    </group>
  );
}

/** 驾驶室 */
function TruckCab() {
  const cabColor = '#1e3a5f';
  const trimColor = '#c0c0c0';

  return (
    <group position={[2.2, 0, 0]}>
      <RoundedBox args={[2.0, 2.2, 2.2]} radius={0.12} position={[0, 1.3, 0]}>
        <meshStandardMaterial color={cabColor} metalness={0.4} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0.05, 2.5, 0]}>
        <boxGeometry args={[2.1, 0.15, 2.3]} />
        <meshStandardMaterial color="#0f2640" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[-0.2, 2.75, 0]}>
        <boxGeometry args={[1.6, 0.4, 2.2]} />
        <meshStandardMaterial color={cabColor} metalness={0.35} roughness={0.5} />
      </mesh>
      <mesh position={[1.01, 1.2, 0]}>
        <boxGeometry args={[0.05, 1.8, 2.1]} />
        <meshStandardMaterial color="#162d4a" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[1.04, 0.9, 0]}>
        <boxGeometry args={[0.04, 0.7, 1.6]} />
        <meshStandardMaterial color="#111" metalness={0.6} roughness={0.3} />
      </mesh>
      {[-0.25, -0.1, 0.05, 0.2].map((y, i) => (
        <mesh key={`grille-${i}`} position={[1.06, 0.9 + y, 0]}>
          <boxGeometry args={[0.02, 0.04, 1.5]} />
          <meshStandardMaterial color={trimColor} metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[1.06, 1.45, 0]}>
        <boxGeometry args={[0.03, 0.12, 0.5]} />
        <meshStandardMaterial color={trimColor} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[1.02, 1.8, 0]}>
        <boxGeometry args={[0.04, 0.8, 1.8]} />
        <meshStandardMaterial color="#1a3a5a" transparent opacity={0.4} metalness={0.1} roughness={0.05} />
      </mesh>
      <mesh position={[0.3, 1.8, 1.11]}>
        <boxGeometry args={[1.0, 0.75, 0.04]} />
        <meshStandardMaterial color="#1a3a5a" transparent opacity={0.35} />
      </mesh>
      <mesh position={[0.3, 1.8, -1.11]}>
        <boxGeometry args={[1.0, 0.75, 0.04]} />
        <meshStandardMaterial color="#1a3a5a" transparent opacity={0.35} />
      </mesh>
      {/* 大灯 */}
      <group position={[1.03, 0.5, 0.85]}>
        <mesh>
          <boxGeometry args={[0.06, 0.25, 0.35]} />
          <meshStandardMaterial color="#ffffff" emissive="#aaddff" emissiveIntensity={0.4} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0.01, 0.15, 0]}>
          <boxGeometry args={[0.04, 0.03, 0.3]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
        </mesh>
      </group>
      <group position={[1.03, 0.5, -0.85]}>
        <mesh>
          <boxGeometry args={[0.06, 0.25, 0.35]} />
          <meshStandardMaterial color="#ffffff" emissive="#aaddff" emissiveIntensity={0.4} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0.01, 0.15, 0]}>
          <boxGeometry args={[0.04, 0.03, 0.3]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
        </mesh>
      </group>
      {/* 保险杠 */}
      <RoundedBox args={[0.3, 0.35, 2.3]} radius={0.05} position={[0.95, 0.05, 0]}>
        <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      {/* 踏板 */}
      <mesh position={[0.5, -0.1, 1.15]}>
        <boxGeometry args={[0.6, 0.08, 0.2]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.5, -0.1, -1.15]}>
        <boxGeometry args={[0.6, 0.08, 0.2]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* 后视镜 */}
      <group position={[0.6, 1.9, 1.35]}>
        <mesh>
          <boxGeometry args={[0.15, 0.3, 0.04]} />
          <meshStandardMaterial color="#111" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      <group position={[0.6, 1.9, -1.35]}>
        <mesh>
          <boxGeometry args={[0.15, 0.3, 0.04]} />
          <meshStandardMaterial color="#111" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      {/* 排气管 */}
      <mesh position={[-0.7, 1.8, -1.2]}>
        <cylinderGeometry args={[0.06, 0.06, 2.0, 12]} />
        <meshStandardMaterial color="#555" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[-0.7, 2.85, -1.2]}>
        <cylinderGeometry args={[0.08, 0.06, 0.1, 12]} />
        <meshStandardMaterial color="#444" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** 货箱 */
function Trailer() {
  return (
    <group position={[-2.2, 0, 0]}>
      <RoundedBox args={[5.5, 2.8, 2.4]} radius={0.06} position={[0, 1.6, 0]}>
        <meshStandardMaterial color="#e8e8e8" metalness={0.2} roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[5.5, 0.12, 2.5]} />
        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.8, 1.21]}>
        <boxGeometry args={[5.4, 0.08, 0.02]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.8, -1.21]}>
        <boxGeometry args={[5.4, 0.08, 0.02]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.2, 1.21]}>
        <boxGeometry args={[5.4, 0.15, 0.02]} />
        <meshStandardMaterial color="#d4380d" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.2, -1.21]}>
        <boxGeometry args={[5.4, 0.15, 0.02]} />
        <meshStandardMaterial color="#d4380d" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[-2.76, 1.6, 0]}>
        <boxGeometry args={[0.06, 2.7, 2.35]} />
        <meshStandardMaterial color="#ddd" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[-2.8, 1.6, 0.3]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
        <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-2.8, 1.6, -0.3]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
        <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-2.78, 0.8, 1.0]}>
        <boxGeometry args={[0.05, 0.2, 0.15]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-2.78, 0.8, -1.0]}>
        <boxGeometry args={[0.05, 0.2, 0.15]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-2.6, 0.2, 0]}>
        <boxGeometry args={[0.08, 0.15, 2.2]} />
        <meshStandardMaterial color="#ff4400" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[-1.2, 0.5, 1.25]}>
        <boxGeometry args={[1.2, 0.6, 0.05]} />
        <meshStandardMaterial color="#222" roughness={0.8} />
      </mesh>
      <mesh position={[-1.2, 0.5, -1.25]}>
        <boxGeometry args={[1.2, 0.6, 0.05]} />
        <meshStandardMaterial color="#222" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** 底盘 */
function Chassis() {
  return (
    <group>
      <mesh position={[0, -0.1, 0.4]}>
        <boxGeometry args={[10, 0.2, 0.12]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.1, -0.4]}>
        <boxGeometry args={[10, 0.2, 0.12]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </mesh>
      {[-3.5, -2.0, -0.5, 1.0, 2.5].map((x, i) => (
        <mesh key={`crossbeam-${i}`} position={[x, -0.1, 0]}>
          <boxGeometry args={[0.1, 0.15, 0.9]} />
          <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <RoundedBox args={[1.0, 0.5, 0.4]} radius={0.05} position={[1.0, -0.05, 0.9]}>
        <meshStandardMaterial color="#444" metalness={0.6} roughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[1.0, 0.5, 0.4]} radius={0.05} position={[1.0, -0.05, -0.9]}>
        <meshStandardMaterial color="#444" metalness={0.6} roughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.4, 0.35]} radius={0.03} position={[0.2, -0.05, 0.9]}>
        <meshStandardMaterial color="#333" metalness={0.4} roughness={0.5} />
      </RoundedBox>
    </group>
  );
}

/** 视角感知标注管理器 */
function AnnotationLayer({
  metrics,
  showAnnotations,
  activeZone,
}: {
  metrics: TruckMetrics;
  showAnnotations: boolean;
  activeZone: AnnotationZone | 'all';
}) {
  if (!showAnnotations) return null;

  return (
    <group>
      {ANNOTATIONS.map((ann) => {
        const value = metrics[ann.metricKey] || '--';
        const status: MetricStatus = ann.getStatus ? ann.getStatus(value) : 'normal';

        // L1 始终显示
        // L2 根据 zone 匹配显示
        let visible = false;
        if (ann.level === 'L1') {
          visible = true;
        } else if (activeZone === 'all') {
          visible = true;
        } else if (ann.zone === activeZone) {
          visible = true;
        }

        return (
          <AnnotationMarker
            key={ann.id}
            annotation={ann}
            value={value}
            visible={visible}
            status={status}
          />
        );
      })}
    </group>
  );
}

/** 地面 */
function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a1f2e" metalness={0.3} roughness={0.7} transparent opacity={0.8} />
      </mesh>
      <gridHelper args={[30, 30, '#2a3a5a', '#1a2540']} position={[0, -0.79, 0]} />
    </group>
  );
}

// ======================== 主组件 ========================

export interface Truck3DProps {
  metrics?: TruckMetrics;
  showAnnotations?: boolean;
  width?: string | number;
  height?: string | number;
}

/** 控制面板 */
function ControlPanel({
  activeZone,
  setActiveZone,
}: {
  activeZone: AnnotationZone | 'all';
  setActiveZone: (zone: AnnotationZone | 'all') => void;
}) {
  const zones: { key: AnnotationZone | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'top', label: '核心' },
    { key: 'cab', label: '动力' },
    { key: 'trailer', label: '货运' },
    { key: 'bottom', label: '行驶' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 4,
        background: 'rgba(10, 15, 30, 0.85)',
        padding: '4px 6px',
        borderRadius: 8,
        border: '1px solid rgba(59, 130, 246, 0.3)',
        backdropFilter: 'blur(8px)',
        zIndex: 10,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {zones.map((z) => (
        <button
          key={z.key}
          onClick={() => setActiveZone(z.key)}
          style={{
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: activeZone === z.key ? 600 : 400,
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer',
            background: activeZone === z.key ? 'rgba(59, 130, 246, 0.7)' : 'transparent',
            color: activeZone === z.key ? '#fff' : 'rgba(255,255,255,0.6)',
            transition: 'all 0.2s',
          }}
        >
          {z.label}
        </button>
      ))}
    </div>
  );
}

/** 3D 卡车展示组件（带智能标签布局） */
export default function Truck3D({
  metrics = {},
  showAnnotations = true,
  width = '100%',
  height = 600,
}: Truck3DProps) {
  const [activeZone, setActiveZone] = useState<AnnotationZone | 'all'>('all');

  const defaultMetrics: TruckMetrics = {
    speed: '0 km/h',
    fuelLevel: '72%',
    loadWeight: '12.5 吨 / 25 吨',
    engine: 'DC13 V8 530HP',
    mileage: '128,450 km',
    tireStatus: '良好',
    emission: '国六 达标',
    brakeTemp: '180°C',
    cargoTemp: '-18°C (冷藏)',
    suspension: '气囊正常',
    ...metrics,
  };

  return (
    <div
      style={{
        width,
        height,
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* 顶部品牌 */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 16,
          color: 'rgba(255,255,255,0.5)',
          fontSize: 13,
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 600,
          letterSpacing: '1px',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        HEAVY TRUCK
      </div>

      {/* 图例 */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 16,
          display: 'flex',
          gap: 12,
          fontSize: 10,
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'system-ui, sans-serif',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <span><span style={{ color: '#3b82f6' }}>●</span> 正常</span>
        <span><span style={{ color: '#f59e0b' }}>●</span> 警告</span>
        <span><span style={{ color: '#ef4444' }}>●</span> 异常</span>
      </div>

      <Canvas
        camera={{ position: [8, 5, 8], fov: 40 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <ambientLight intensity={0.3} color="#b4c6e7" />
        <directionalLight position={[10, 12, 8]} intensity={1.2} color="#ffffff" castShadow />
        <directionalLight position={[-8, 6, -4]} intensity={0.4} color="#6b8cce" />
        <pointLight position={[4, 8, -6]} intensity={0.3} color="#ffd4a0" />
        <hemisphereLight color="#87ceeb" groundColor="#1a1a2e" intensity={0.4} />

        <TruckCab />
        <Trailer />
        <Chassis />

        {/* 轮子 */}
        <DetailedWheel position={[2.5, -0.35, 1.1]} />
        <DetailedWheel position={[2.5, -0.35, -1.1]} />
        <DetailedWheel position={[0.5, -0.35, 1.1]} />
        <DetailedWheel position={[0.5, -0.35, -1.1]} />
        <DetailedWheel position={[-0.2, -0.35, 1.1]} />
        <DetailedWheel position={[-0.2, -0.35, -1.1]} />
        <DetailedWheel position={[-3.0, -0.35, 1.1]} />
        <DetailedWheel position={[-3.0, -0.35, -1.1]} />
        <DetailedWheel position={[-3.7, -0.35, 1.1]} />
        <DetailedWheel position={[-3.7, -0.35, -1.1]} />
        <DetailedWheel position={[-4.4, -0.35, 1.1]} />
        <DetailedWheel position={[-4.4, -0.35, -1.1]} />

        {/* 标注层 */}
        <AnnotationLayer
          metrics={defaultMetrics}
          showAnnotations={showAnnotations}
          activeZone={activeZone}
        />

        <Ground />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={18}
          maxPolarAngle={Math.PI / 2.05}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>

      {/* 底部区域切换面板 */}
      {showAnnotations && (
        <ControlPanel activeZone={activeZone} setActiveZone={setActiveZone} />
      )}
    </div>
  );
}
