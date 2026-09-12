"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { BufferGeometry, Group, Material, Mesh, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { ViewMode } from "@/lib/app-context";
import { bellowsFoldPose, revealParts } from "@/lib/vehicle-model";
import { ViewToggle } from "./ViewToggle";

const MODEL_URL = "/models/new-flyer-xd60.glb";
const CONTROL_CLASS = "h-9 rounded border border-border-soft bg-surface px-3 text-footnote font-bold uppercase tracking-loud text-blue outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";

type RevealGroup = {
  node: Object3D;
  originY: number;
  originZ: number;
  materials: Material[];
};

type VehicleModelViewProps = {
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
};

function makeRevealGroup(node: Object3D | null | undefined): RevealGroup | null {
  if (!node) return null;
  const materials: Material[] = [];
  node.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    const source = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const clones = source.map((material) => {
      const clone = material.clone();
      clone.transparent = true;
      materials.push(clone);
      return clone;
    });
    mesh.material = Array.isArray(mesh.material) ? clones : clones[0];
  });
  return { node, originY: node.position.y, originZ: node.position.z, materials };
}

function disposeTree(root: Object3D) {
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => material.dispose());
  });
}

export function VehicleModelView({ viewMode, onSetViewMode }: VehicleModelViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const modelRootRef = useRef<Group | null>(null);
  const pausedRef = useRef(false);
  const insideRef = useRef(false);
  const bendRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const [inside, setInside] = useState(false);
  const [bend, setBend] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    insideRef.current = inside;
  }, [inside]);
  useEffect(() => {
    bendRef.current = bend;
  }, [bend]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const shell = shellRef.current;
    if (!canvas || !shell) return;
    const canvasElement = canvas;
    const shellElement = shell;

    let disposed = false;
    let frame = 0;
    let renderer: WebGLRenderer | null = null;
    let scene: Scene | null = null;
    let camera: PerspectiveCamera | null = null;
    let loadedRoot: Object3D | null = null;
    let cleanupControls: (() => void) | null = null;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduceMotion.matches) {
      pausedRef.current = true;
      queueMicrotask(() => setPaused(true));
    }

    const contextLost = (event: Event) => {
      event.preventDefault();
      setStatus("error");
    };
    canvasElement.addEventListener("webglcontextlost", contextLost);

    async function start() {
      try {
        const [THREE, { GLTFLoader }, { OrbitControls }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
          import("three/examples/jsm/controls/OrbitControls.js"),
        ]);
        if (disposed) return;

        renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.setClearColor(0xfcfbf7, 0);

        scene = new THREE.Scene();
        scene.add(new THREE.HemisphereLight(0xf7faf0, 0x6e7766, 2.2));
        const key = new THREE.DirectionalLight(0xffffff, 3.1);
        key.position.set(7, 12, 9);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xf8e7cb, 1.2);
        fill.position.set(-8, 5, -10);
        scene.add(fill);

        camera = new THREE.PerspectiveCamera(32, 1, 0.1, 160);
        const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
        if (disposed) {
          disposeTree(gltf.scene);
          return;
        }
        loadedRoot = gltf.scene;

        const modelRoot = new THREE.Group();
        modelRoot.name = "loadline_xd60_view";
        modelRoot.add(gltf.scene);
        scene.add(modelRoot);
        modelRootRef.current = modelRoot;

        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        gltf.scene.position.sub(center);

        const roofGroups = ["front_roof_HVAC", "rear_roof_HVAC"].map((name) => makeRevealGroup(gltf.scene.getObjectByName(name))).filter((group): group is RevealGroup => !!group);
        const panelGroups = ["front_reveal_panels", "rear_reveal_panels"].map((name) => makeRevealGroup(gltf.scene.getObjectByName(name))).filter((group): group is RevealGroup => !!group);
        const rear = gltf.scene.getObjectByName("rear_module_articulation_pivot");
        const folds = Array.from({ length: 19 }, (_, index) => gltf.scene.getObjectByName(`bellows_fold_${index}`)).filter((fold): fold is Object3D => !!fold);
        const membrane = gltf.scene.getObjectByName("continuous_accordion_membrane") as Mesh<BufferGeometry> | undefined;
        if (membrane?.isMesh) membrane.geometry = membrane.geometry.clone();

        const resize = () => {
          if (!renderer || !camera) return;
          const width = Math.max(1, shellElement.clientWidth);
          const height = Math.max(1, shellElement.clientHeight);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(shellElement);

        const verticalFov = THREE.MathUtils.degToRad(camera.fov);
        const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
        const distance = Math.max(size.x / (2 * Math.tan(horizontalFov / 2)), size.y / (2 * Math.tan(verticalFov / 2))) * 1.18;
        camera.position.set(0, size.y * 0.22, distance);
        camera.lookAt(0, 0, 0);

        const controls = new OrbitControls(camera, canvasElement);
        controls.target.set(0, 0, 0);
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.rotateSpeed = 0.65;
        controls.zoomSpeed = 0.7;
        controls.minDistance = distance * 0.72;
        controls.maxDistance = distance * 1.65;
        controls.minPolarAngle = 0.72;
        controls.maxPolarAngle = 1.46;
        controls.autoRotateSpeed = 1.25;
        controls.update();

        const motionChange = () => {
          if (reduceMotion.matches) setPaused(true);
        };
        reduceMotion.addEventListener("change", motionChange);
        cleanupControls = () => {
          observer.disconnect();
          reduceMotion.removeEventListener("change", motionChange);
          controls.dispose();
        };

        let reveal = 0;
        let previous = performance.now();
        let appliedBend = Number.NaN;

        const applyReveal = (progress: number) => {
          const phases = revealParts(progress);
          for (const group of roofGroups) {
            group.node.position.y = group.originY + phases.roof * 2;
            group.node.position.z = group.originZ - phases.roof * 0.8;
            group.node.visible = phases.roof < 0.995;
            group.materials.forEach((material) => {
              material.opacity = 1 - phases.roof;
              material.depthWrite = phases.roof < 0.05;
            });
          }
          for (const group of panelGroups) {
            group.node.position.y = group.originY + phases.panels * 0.6;
            group.node.visible = phases.panels < 0.995;
            group.materials.forEach((material) => {
              material.opacity = 1 - phases.panels;
              material.depthWrite = phases.panels < 0.05;
            });
          }
        };

        const applyBend = (degrees: number) => {
          const radians = THREE.MathUtils.degToRad(degrees);
          if (rear) rear.rotation.y = radians;
          folds.forEach((fold, index) => {
            const pose = bellowsFoldPose(index, folds.length, degrees);
            fold.position.x = pose.x;
            fold.position.z = pose.z;
            fold.rotation.y = pose.yaw;
          });
          if (!membrane?.isMesh) return;
          const positions = membrane.geometry.attributes.position;
          folds.forEach((fold, index) => {
            const pose = bellowsFoldPose(index, folds.length, degrees);
            const crossSection: [number, number][] = [[0.4, -1.22], [2.81, -1.22], [2.81, 1.22], [0.4, 1.22]];
            crossSection.forEach(([y, z], corner) => {
              const rotatedX = z * Math.sin(pose.yaw);
              const rotatedZ = z * Math.cos(pose.yaw);
              positions.setXYZ(index * 4 + corner, pose.x + rotatedX, y, pose.z + rotatedZ);
            });
          });
          positions.needsUpdate = true;
          membrane.geometry.computeVertexNormals();
          membrane.geometry.computeBoundingSphere();
        };

        const animate = (now: number) => {
          if (!renderer || !scene || !camera || disposed) return;
          const delta = Math.min(0.05, Math.max(0, (now - previous) / 1000));
          previous = now;
          const target = insideRef.current ? 1 : 0;
          if (reveal !== target) {
            const step = delta / 0.85;
            reveal = target > reveal ? Math.min(target, reveal + step) : Math.max(target, reveal - step);
            applyReveal(reveal);
          }
          if (bendRef.current !== appliedBend) {
            applyBend(bendRef.current);
            appliedBend = bendRef.current;
          }
          controls.autoRotate = !pausedRef.current && !reduceMotion.matches;
          controls.update(delta);
          renderer.render(scene, camera);
          frame = requestAnimationFrame(animate);
        };

        applyReveal(0);
        applyBend(0);
        setStatus("ready");
        frame = requestAnimationFrame(animate);
      } catch (error) {
        console.error("XD60 model failed to load", error);
        if (!disposed) setStatus("error");
      }
    }

    void start();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cleanupControls?.();
      canvasElement.removeEventListener("webglcontextlost", contextLost);
      modelRootRef.current = null;
      if (loadedRoot) disposeTree(loadedRoot);
      renderer?.dispose();
      renderer = null;
      scene = null;
      camera = null;
    };
  }, []);

  function rotateFromKeyboard(event: React.KeyboardEvent<HTMLCanvasElement>) {
    const direction = event.key === "ArrowLeft" ? 1 : event.key === "ArrowRight" ? -1 : 0;
    if (!direction || !modelRootRef.current) return;
    event.preventDefault();
    modelRootRef.current.rotation.y += direction * 0.16;
  }

  const poster = inside ? "/models/xd60-cutaway.png" : "/models/xd60-exterior.png";

  return (
    <div ref={shellRef} className="relative h-full w-full overflow-hidden rounded border border-border-soft bg-canvas">
      <Image
        src={poster}
        alt="New Flyer XD60 concept vehicle preview"
        fill
        sizes="(max-width: 767px) 100vw, 480px"
        className={`object-contain px-2 pb-12 pt-9 transition-opacity duration-300 motion-reduce:transition-none ${status === "ready" ? "opacity-0" : "opacity-100"}`}
      />
      <canvas
        ref={canvasRef}
        tabIndex={0}
        onKeyDown={rotateFromKeyboard}
        aria-label="Interactive 3D New Flyer XD60 concept model. Drag to orbit, scroll or pinch to zoom, or use the left and right arrow keys."
        className={`relative h-full w-full touch-none outline-none transition-opacity duration-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue motion-reduce:transition-none ${status === "ready" ? "opacity-100" : "opacity-0"}`}
      />

      <div className="pointer-events-none absolute left-[11px] top-[11px] max-w-[122px]">
        <p className="text-row-title font-bold text-ink-deep">XD60</p>
        <p className="text-footnote uppercase tracking-loud text-blue">interactive cutaway</p>
      </div>
      <ViewToggle viewMode={viewMode} onChange={onSetViewMode} />

      <div className="absolute bottom-[9px] left-[11px] right-[11px] flex items-end gap-2">
        <button type="button" className={CONTROL_CLASS} onClick={() => setPaused((value) => !value)} aria-pressed={paused} disabled={status !== "ready"}>
          {paused ? "Play" : "Pause"}
        </button>
        <button type="button" className={CONTROL_CLASS} onClick={() => setInside((value) => !value)} aria-pressed={inside} disabled={status !== "ready"}>
          {inside ? "Exterior" : "See inside"}
        </button>
        <label className="ml-auto flex min-w-0 flex-1 flex-col text-footnote font-bold uppercase tracking-loud text-blue">
          <span>Bend {bend > 0 ? `+${bend}` : bend}°</span>
          <input
            type="range"
            min="-30"
            max="30"
            value={bend}
            onChange={(event) => setBend(Number(event.target.value))}
            disabled={status !== "ready"}
            aria-label="Bend the articulated bus"
            className="h-5 w-full cursor-ew-resize accent-blue disabled:opacity-40"
          />
        </label>
      </div>

      <p className="pointer-events-none absolute bottom-[47px] left-[11px] right-[11px] text-center text-footnote text-blue opacity-footnote">
        {status === "loading" ? "Loading local 3D model…" : status === "error" ? "3D unavailable · showing the supplied render" : "Drag to orbit · illustrative model · not live occupancy"}
      </p>
    </div>
  );
}
