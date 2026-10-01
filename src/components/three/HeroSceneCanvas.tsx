import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// The actual R3F scene. Kept in its own file (loaded via React.lazy from
// HeroScene.tsx) so the Three.js/R3F bundle is never pulled into the main
// chunk for people who never scroll to or render the hero.

const LAVENDER = new THREE.Color("#9984d8");
const MINT = new THREE.Color("#3fcb7f");

function Lattice() {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  // Thin-line grid, built once. Disposed automatically by R3F when the
  // Canvas unmounts (geometries/materials created here are owned by it).
  const gridGeometry = useMemo(() => {
    const size = 14;
    const divisions = 22;
    const points: number[] = [];
    const half = size / 2;
    const step = size / divisions;

    for (let i = 0; i <= divisions; i++) {
      const p = -half + i * step;
      points.push(-half, 0, p, half, 0, p);
      points.push(p, 0, -half, p, 0, half);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, []);

  const nodes = useMemo(() => {
    const count = 46;
    const positions: { x: number; y: number; z: number; color: THREE.Color; scale: number }[] = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 13;
      const z = (Math.random() - 0.5) * 13;
      const y = Math.random() * 2.2;
      positions.push({
        x,
        y,
        z,
        color: Math.random() > 0.6 ? MINT : LAVENDER,
        scale: 0.04 + Math.random() * 0.07,
      });
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.06;

    // Subtle pointer parallax: ease camera toward the cursor.
    const targetX = (state.pointer.x * viewport.width) / 12;
    const targetY = 1.4 + (state.pointer.y * viewport.height) / 40;
    state.camera.position.x += (targetX - state.camera.position.x) * 0.03;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.03;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef} rotation={[0.55, 0, 0]} position={[0, -0.6, 0]}>
      <lineSegments geometry={gridGeometry}>
        <lineBasicMaterial color="#333333" transparent opacity={0.5} />
      </lineSegments>
      {nodes.map((n, i) => (
        <mesh key={i} position={[n.x, n.y, n.z]}>
          <sphereGeometry args={[n.scale, 8, 8]} />
          <meshBasicMaterial color={n.color} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

export function HeroSceneCanvas() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 1.4, 6.2], fov: 45 }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.6} />
      <Lattice />
    </Canvas>
  );
}
