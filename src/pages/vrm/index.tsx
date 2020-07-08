import { VRM, VRMSchema, VRMUtils } from "@pixiv/three-vrm";
import * as facemesh from "@tensorflow-models/facemesh";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import * as style from "./index.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const estimatePose = (annotations: any) => {
  const faces = annotations.silhouette;
  const x1 = new THREE.Vector3().fromArray(faces[9]);
  const x2 = new THREE.Vector3().fromArray(faces[27]);
  const y1 = new THREE.Vector3().fromArray(faces[18]);
  const y2 = new THREE.Vector3().fromArray(faces[0]);
  const xaxis = x2.sub(x1).normalize();
  const yaxis = y2.sub(y1).normalize();
  const zaxis = new THREE.Vector3().crossVectors(xaxis, yaxis);
  const mat = new THREE.Matrix4()
    .makeBasis(xaxis, yaxis, zaxis)
    .premultiply(new THREE.Matrix4().makeRotationZ(Math.PI));
  return new THREE.Quaternion().setFromRotationMatrix(mat);
};

const execFacemesh = async (videoElement: HTMLVideoElement, clock: THREE.Clock, vrm: VRM, model: facemesh.FaceMesh) => {
  if (!vrm || !vrm.humanoid || !vrm.blendShapeProxy) return;

  vrm.update(clock.getDelta());
  const faces = await model.estimateFaces(videoElement, false, false);

  faces.forEach(face => {
    if (!(face.scaledMesh instanceof Array)) return;
    if (!vrm || !vrm.humanoid || !vrm.blendShapeProxy) return;

    // @ts-ignore
    const annotations = face.annotations;
    const q = estimatePose(annotations);
    const head = vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.Head);
    if (!head) return;
    if (!clock) return;

    head.quaternion.slerp(q, 0.1);
    const blink = Math.max(0.0, 1.0 - 10.0 * Math.abs((clock.getElapsedTime() % 4.0) - 2.0));
    vrm.blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.Blink, blink);
    const lipsLowerInner = annotations.lipsLowerInner[5];
    const lipsUpperInner = annotations.lipsUpperInner[5];
    const expressionA = Math.max(0, Math.min(1, (lipsLowerInner[1] - lipsUpperInner[1]) / 10.0));
    vrm.blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.A, expressionA);
  });
};

const vrmLoad = async (divElement: HTMLDivElement, videoElement: HTMLVideoElement) => {
  const width = 320;
  const height = 240;

  // renderer
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  divElement.appendChild(renderer.domElement);

  // camera
  const camera = new THREE.PerspectiveCamera(30.0, width / height, 0.1, 20.0);
  camera.position.set(0.0, 1.5, 1.0);

  // camera controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.screenSpacePanning = true;
  controls.target.set(0.0, 1.5, 0.0);
  controls.update();

  // scene
  const scene = new THREE.Scene();

  // light
  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(1.0, 1.0, 1.0).normalize();
  scene.add(light);

  // gltf and vrm
  const loader = new GLTFLoader();
  loader.crossOrigin = "anonymous";
  let currentVRM: VRM;
  const model = await facemesh.load({ maxFaces: 1 });

  const load = (url: string) =>
    loader.load(
      url,
      gltf => {
        VRMUtils.removeUnnecessaryJoints(gltf.scene);

        VRM.from(gltf).then(vrm => {
          if (currentVRM) {
            scene.remove(currentVRM.scene);
            currentVRM.dispose();
          }

          currentVRM = vrm;
          scene.add(vrm.scene);

          if (!vrm.humanoid) return;
          const hipBoneNode = vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.Hips);
          if (hipBoneNode) hipBoneNode.rotation.y = Math.PI;

          const leftUpperArmBoneNode = vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftUpperArm);
          if (leftUpperArmBoneNode) leftUpperArmBoneNode.rotation.z = 1;

          const rightUpperArmBoneNode = vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightUpperArm);
          if (rightUpperArmBoneNode) rightUpperArmBoneNode.rotation.z = -1;

          const clock = new THREE.Clock();
          clock.start();

          const animate = async () => {
            window.requestAnimationFrame(animate);

            await execFacemesh(videoElement, clock, vrm, model);
            renderer.render(scene, camera);
          };

          animate();
        });
      },

      progress => console.log("Loading model...", 100.0 * (progress.loaded / progress.total), "%"),
      error => console.error(error),
    );

  load("./igarashi.vrm");

  divElement.addEventListener("dragover", event => {
    event.preventDefault();
  });

  divElement.addEventListener("drop", event => {
    event.preventDefault();

    if (!event.dataTransfer) return;

    const files = event.dataTransfer.files;
    if (!files) return;

    const file = files[0];
    if (!file) return;

    const blob = new Blob([file], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    load(url);
  });
};

const VRMComponent = () => {
  const vrmElementRef = React.useRef<HTMLDivElement>(null);
  const videoElementRef = React.useRef<HTMLVideoElement>(null);
  const query = location.search
    .substring(1)
    .split("&")
    .map(p => p.split("="))
    .reduce((obj, e) => ({ ...obj, [e[0]]: e[1] }), {}) as {
    vrmBackgroundColor: string;
    videoDeviceID: string;
  };

  React.useEffect(() => {
    (async () => {
      if (!videoElementRef.current) return;
      if (!vrmElementRef.current) return;

      const videoElement = videoElementRef.current;

      const userMedia = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: query.videoDeviceID,
        },
        audio: false,
      });
      videoElement.srcObject = userMedia;

      // eslint-disable-next-line require-atomic-updates
      videoElement.onloadedmetadata = async () => {
        await videoElement.play();
      };

      const vrmElement = vrmElementRef.current;
      await vrmLoad(vrmElement, videoElement);
    })();
  }, []);

  return (
    <main className={style.main}>
      <div ref={vrmElementRef} style={{ background: query.vrmBackgroundColor }} className={style.vrm} />
      <video ref={videoElementRef} controls={true} autoPlay={true} playsInline={true} className={style.video} />
    </main>
  );
};

ReactDOM.render(<VRMComponent />, document.getElementById("app"));
