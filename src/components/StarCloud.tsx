"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ArticleNode } from "@/lib/types";
import { CHANNEL_COLORS, scoreToSize } from "@/lib/constants";

const vertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  uniform float time;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    float twinkle = 0.7 + 0.3 * sin(time * 2.0 + aPhase);
    vAlpha = twinkle;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.12, 0.0, d);
    vec3 finalColor = mix(vColor, vec3(1.0), core * 0.7);
    float alpha = glow * vAlpha;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

interface StarCloudProps {
  nodes: ArticleNode[];
  positions: Map<string, [number, number, number]>;
  activeChannel: string;
}

export function StarCloud({
  nodes,
  positions,
  activeChannel,
}: StarCloudProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const posArr = new Float32Array(nodes.length * 3);
    const colorArr = new Float32Array(nodes.length * 3);
    const sizeArr = new Float32Array(nodes.length);
    const phaseArr = new Float32Array(nodes.length);

    nodes.forEach((node, i) => {
      const pos = positions.get(node.id) || [0, 0, 0];
      posArr[i * 3] = pos[0];
      posArr[i * 3 + 1] = pos[1];
      posArr[i * 3 + 2] = pos[2];

      const hex = CHANNEL_COLORS[node.channel] || "#ffffff";
      const color = new THREE.Color(hex);
      colorArr[i * 3] = color.r;
      colorArr[i * 3 + 1] = color.g;
      colorArr[i * 3 + 2] = color.b;

      const visible =
        activeChannel === "all" || node.channel === activeChannel;
      sizeArr[i] = visible ? scoreToSize(node.score) * 4 : 0;
      phaseArr[i] = Math.random() * Math.PI * 2;
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colorArr, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizeArr, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phaseArr, 1));
    return geo;
  }, [nodes, positions, activeChannel]);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value += delta;
    }
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={{ time: { value: 0 } }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
