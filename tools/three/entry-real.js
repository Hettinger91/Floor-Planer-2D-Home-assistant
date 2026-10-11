import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, BoxGeometry, CylinderGeometry, PlaneGeometry, ShapeGeometry, ExtrudeGeometry, Shape,
  MeshStandardMaterial, MeshBasicMaterial, AmbientLight, HemisphereLight, DirectionalLight, PointLight, Raycaster, Vector2, Vector3, Color,
  Sprite, SpriteMaterial, CanvasTexture, EdgesGeometry, LineSegments, LineBasicMaterial, SRGBColorSpace, DoubleSide, AdditiveBlending,
  RepeatWrapping, PCFShadowMap, SphereGeometry, BufferGeometry, Float32BufferAttribute, TorusGeometry, LatheGeometry, CapsuleGeometry, MeshPhysicalMaterial, TubeGeometry, CatmullRomCurve3, ACESFilmicToneMapping, Box3, Fog, CircleGeometry, MathUtils,
  PMREMGenerator, PCFSoftShadowMap, VSMShadowMap, NoToneMapping, AgXToneMapping, DataTexture, Texture, RGBAFormat, UnsignedByteType, LinearFilter, LinearMipmapLinearFilter,
  HalfFloatType, WebGLRenderTarget, ShaderMaterial, FogExp2, SpotLight, RectAreaLight, FrontSide, BackSide, Matrix4, Quaternion, Euler, Plane,
} from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
window.THREE_REAL = {
  Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, BoxGeometry, CylinderGeometry, PlaneGeometry, ShapeGeometry, ExtrudeGeometry, Shape,
  MeshStandardMaterial, MeshBasicMaterial, AmbientLight, HemisphereLight, DirectionalLight, PointLight, Raycaster, Vector2, Vector3, Color,
  Sprite, SpriteMaterial, CanvasTexture, EdgesGeometry, LineSegments, LineBasicMaterial, SRGBColorSpace, DoubleSide, AdditiveBlending,
  RepeatWrapping, PCFShadowMap, SphereGeometry, BufferGeometry, Float32BufferAttribute, TorusGeometry, LatheGeometry, CapsuleGeometry, MeshPhysicalMaterial, TubeGeometry, CatmullRomCurve3, ACESFilmicToneMapping, Box3, Fog, CircleGeometry, MathUtils,
  PMREMGenerator, PCFSoftShadowMap, VSMShadowMap, NoToneMapping, AgXToneMapping, DataTexture, Texture, RGBAFormat, UnsignedByteType, LinearFilter, LinearMipmapLinearFilter,
  HalfFloatType, WebGLRenderTarget, ShaderMaterial, FogExp2, SpotLight, RectAreaLight, FrontSide, BackSide, Matrix4, Quaternion, Euler, Plane,
  Sky, EffectComposer, RenderPass, GTAOPass, UnrealBloomPass, OutputPass, SMAAPass,
};
