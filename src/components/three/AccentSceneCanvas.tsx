import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const LAVENDER = new THREE.Color("#9984d8");
const MINT = new THREE.Color("#3fcb7f");

function NodeNetwork() {
  const groupRef = useRef<THREE.Group>(null);

  const nodes = useMemo(() => {
    const count = 18;
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 4.5,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 2.5
      ),
      color: Math.random() > 0.7 ? MINT : LAVENDER,
    }));
  }, []);

  const lineGeometry = useMemo(() => {
    const points: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].position.distanceTo(nodes[j].position) < 1.6) {
          points.push(nodes[i].position.x, nodes[i].position.y, nodes[i].position.z);
          points.push(nodes[j].position.x, nodes[j].position.y, nodes[j].position.z);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, [nodes]);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.05;
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color="#333333" transparent opacity={0.6} />
      </lineSegments>
      {nodes.map((n, i) => (
        <mesh key={i} position={n.position}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={n.color} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

export function AccentSceneCanvas({ active = true }: { active?: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 5.5], fov: 40 }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.6} />
      <NodeNetwork />
    </Canvas>
  );
}
