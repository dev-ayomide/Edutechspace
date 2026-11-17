// The laptop scene: a real 3D laptop (three.js) whose lid, camera and screen follow the scroll, smoothed every frame.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const sec = document.getElementById('journey')
const canvas = sec.querySelector('canvas')
const pin = sec.querySelector('.pin')
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------------- renderer, scene, camera ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05
renderer.outputColorSpace = THREE.SRGBColorSpace

const scene = new THREE.Scene()
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 100)

const key = new THREE.DirectionalLight('#ffffff', 1.4)
key.position.set(3, 6, 4)
scene.add(key)
const rim = new THREE.DirectionalLight('#7fe9ff', 1.1)
rim.position.set(-4, 2, -5)
scene.add(rim)
scene.add(new THREE.AmbientLight('#9fb4ff', 0.25))

/* ---------------- the RUNTech Space "R" mark, as vector paths (from the supplied artwork) ---------------- */
// Drawn in a 420 x 482 box. Light top bowl, mid-blue left triangle, indigo leg.
const drawMark = (g, x, y, h) => {
  const s = h / 482
  g.save()
  g.translate(x, y)
  g.scale(s, s)
  g.fillStyle = '#74e8fb'
  g.beginPath()
  g.moveTo(0, 0)
  g.lineTo(295, 0)
  g.bezierCurveTo(365, 0, 420, 55, 420, 125)
  g.lineTo(420, 142)
  g.bezierCurveTo(420, 182, 402, 216, 385, 232)
  g.lineTo(260, 312)
  g.closePath()
  g.fill()
  g.fillStyle = '#0a84ff'
  g.beginPath()
  g.moveTo(0, 0)
  g.lineTo(260, 312)
  g.lineTo(0, 482)
  g.closePath()
  g.fill()
  g.fillStyle = '#2723b0'
  g.beginPath()
  g.moveTo(0, 482)
  g.lineTo(260, 312)
  g.lineTo(402, 482)
  g.closePath()
  g.fill()
  g.restore()
}

/* ---------------- materials: MacBook silver ---------------- */
const aluminium = new THREE.MeshPhysicalMaterial({
  color: '#d4d7dd',
  metalness: 0.95,
  roughness: 0.24,
  clearcoat: 0.25,
  clearcoatRoughness: 0.4,
})
const keyMat = new THREE.MeshStandardMaterial({ color: '#08090c', metalness: 0.05, roughness: 0.72 })
const wellMat = new THREE.MeshStandardMaterial({ color: '#8d929d', metalness: 0.85, roughness: 0.4 })
const padMat = new THREE.MeshPhysicalMaterial({ color: '#b3b8c2', metalness: 0.55, roughness: 0.16, clearcoat: 1 })
const glassMat = new THREE.MeshPhysicalMaterial({ color: '#050608', roughness: 0.08, metalness: 0.1, clearcoat: 1 })
const hingeMat = new THREE.MeshStandardMaterial({ color: '#16171c', metalness: 0.6, roughness: 0.35 })

/* ---------------- shapes ---------------- */
const roundedRect = (w, h, r) => {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}
// a slab with rounded corners and softly bevelled edges, `t` thick along Z, centred
const slab = (w, h, t, r, bevel) => {
  const g = new THREE.ExtrudeGeometry(roundedRect(w - bevel * 2, h - bevel * 2, r), {
    depth: Math.max(0.001, t - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 18,
  })
  g.center()
  return g
}
const canvasTex = (w, h, draw) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/* ---------------- dimensions (1 unit = 10 cm, MacBook Pro 14-ish) ---------------- */
const W = 3.12
const D = 2.21
const BASE_H = 0.075
const LID_T = 0.036
const SCR_W = W - 0.11
const SCR_H = SCR_W / 1.6
const LID_H = SCR_H + 0.13

const laptop = new THREE.Group()
scene.add(laptop)

// base: rounded slab lying flat
const base = new THREE.Mesh(slab(W, D, BASE_H, 0.16, 0.025), aluminium)
base.rotation.x = -Math.PI / 2
base.position.y = BASE_H / 2
laptop.add(base)
const TOP = BASE_H + 0.0005

// keyboard: real layout (unit widths per row), black keys in a dark well
const deckW = W * 0.72
const rows = [
  { h: 0.55, keys: [1.5, ...Array(12).fill(1), 1.5] },
  { h: 1, keys: [...Array(13).fill(1), 2] },
  { h: 1, keys: [1.5, ...Array(12).fill(1), 1.5] },
  { h: 1, keys: [1.8, ...Array(11).fill(1), 2.2] },
  { h: 1, keys: [2.35, ...Array(10).fill(1), 2.65] },
  { h: 1, keys: [1, 1, 1, 1.25, 5.5, 1.25, 1, 1, 1, 1] },
]
const gap = 0.011
const unitW = (deckW - gap * 14) / 15
const unitH = unitW * 0.98
const deckD = rows.reduce((t, r) => t + r.h * unitH, 0) + gap * (rows.length - 1)
const deckZ = -D / 2 + 0.2 + deckD / 2
const well = new THREE.Mesh(slab(deckW + 0.05, deckD + 0.05, 0.004, 0.025, 0.001), wellMat)
well.rotation.x = -Math.PI / 2
well.position.set(0, TOP, deckZ)
laptop.add(well)
const keyGeo = new RoundedBoxGeometry(1, 1, 1, 3, 0.2)
const keyCount = rows.reduce((t, r) => t + r.keys.length, 0) + 1 // +1: up/down arrows share a slot
const keys = new THREE.InstancedMesh(keyGeo, keyMat, keyCount)
const m4 = new THREE.Matrix4()
const q0 = new THREE.Quaternion()
let k = 0
let zCursor = deckZ - deckD / 2
rows.forEach((row, ri) => {
  const rowW = row.keys.reduce((a, b) => a + b, 0)
  const scale = (deckW - gap * (row.keys.length - 1)) / (rowW * unitW)
  let x = -deckW / 2
  const kd = row.h * unitH
  row.keys.forEach((u, ki) => {
    const kw = u * unitW * scale
    // arrow cluster: up/down share one slot on the bottom row
    const isUpDown = ri === 5 && ki === 8
    if (isUpDown) {
      for (const dz of [-kd / 4, kd / 4]) {
        m4.compose(new THREE.Vector3(x + kw / 2, TOP + 0.009, zCursor + kd / 2 + dz), q0, new THREE.Vector3(kw * 0.9, 0.016, kd / 2 - gap))
        keys.setMatrixAt(k++, m4)
      }
    } else {
      m4.compose(new THREE.Vector3(x + kw / 2, TOP + 0.009, zCursor + kd / 2), q0, new THREE.Vector3(kw - gap, 0.016, kd - gap))
      keys.setMatrixAt(k++, m4)
    }
    x += kw + gap
  })
  zCursor += kd + gap
})
keys.count = k
laptop.add(keys)

// speaker grilles either side of the keyboard
const grille = canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = 'rgba(0,0,0,0)'
  g.fillRect(0, 0, w, h)
  g.fillStyle = 'rgba(40,42,50,0.85)'
  for (let y = 10; y < h; y += 14) for (let x = 10 + ((y / 14) % 2) * 7; x < w; x += 14) g.fillRect(x, y, 4, 4)
})
const grilleW = (W - deckW) / 2 - 0.16
for (const side of [-1, 1]) {
  const gm = new THREE.Mesh(new THREE.PlaneGeometry(grilleW, deckD), new THREE.MeshBasicMaterial({ map: grille, transparent: true }))
  gm.rotation.x = -Math.PI / 2
  gm.position.set(side * (deckW / 2 + 0.08 + grilleW / 2), TOP + 0.0004, deckZ)
  laptop.add(gm)
}

// large glass trackpad
const pad = new THREE.Mesh(slab(W * 0.43, D * 0.31, 0.003, 0.05, 0.001), padMat)
pad.rotation.x = -Math.PI / 2
pad.position.set(0, TOP + 0.001, deckZ + deckD / 2 + 0.12 + (D * 0.31) / 2)
laptop.add(pad)

// thumb scoop at the front edge
const scoop = new THREE.Mesh(slab(0.5, 0.05, 0.02, 0.02, 0.005), hingeMat)
scoop.material = new THREE.MeshStandardMaterial({ color: '#a7acb6', metalness: 0.9, roughness: 0.3 })
scoop.position.set(0, TOP - 0.004, D / 2 - 0.012)
laptop.add(scoop)

// hinge
const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, W * 0.84, 24), hingeMat)
hinge.rotation.z = Math.PI / 2
hinge.position.set(0, BASE_H + 0.006, -D / 2 + 0.04)
laptop.add(hinge)

// lid: pivots on the hinge
const lidPivot = new THREE.Group()
lidPivot.position.set(0, BASE_H + 0.022, -D / 2 + 0.045)
laptop.add(lidPivot)
const lid = new THREE.Mesh(slab(W, LID_H, LID_T, 0.16, 0.012), aluminium)
lid.position.y = LID_H / 2
lidPivot.add(lid)
const FRONT = LID_T / 2

// glass front with thin bezels
const glass = new THREE.Mesh(slab(W - 0.03, LID_H - 0.03, 0.003, 0.14, 0.0008), glassMat)
glass.position.set(0, LID_H / 2, FRONT + 0.0006)
lidPivot.add(glass)
const screenY = LID_H - 0.045 - SCR_H / 2
const makeDisplay = (z) => {
  const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, toneMapped: false })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(SCR_W - 0.02, SCR_H), mat)
  mesh.position.set(0, screenY, FRONT + z)
  lidPivot.add(mesh)
  return mesh
}
const displayA = makeDisplay(0.0024)
const displayB = makeDisplay(0.0028)
displayB.material.opacity = 0
const screenOff = new THREE.Mesh(
  new THREE.PlaneGeometry(SCR_W - 0.02, SCR_H),
  new THREE.MeshBasicMaterial({ color: '#030409', transparent: true, opacity: 1, toneMapped: false }),
)
screenOff.position.set(0, screenY, FRONT + 0.0032)
lidPivot.add(screenOff)
// notch with camera
const notch = new THREE.Mesh(slab(0.34, 0.07, 0.0005, 0.025, 0.0001), new THREE.MeshBasicMaterial({ color: '#050608' }))
notch.position.set(0, LID_H - 0.035 - 0.012, FRONT + 0.0036)
lidPivot.add(notch)
const camDot = new THREE.Mesh(new THREE.CircleGeometry(0.01, 20), new THREE.MeshBasicMaterial({ color: '#1d2333' }))
camDot.position.set(0, LID_H - 0.04, FRONT + 0.0040)
lidPivot.add(camDot)
// brand under the display
const chin = canvasTex(1024, 64, (g, w, h) => {
  g.fillStyle = '#8b90a0'
  g.font = '500 30px "DM Sans", system-ui, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('RUNTech Space', w / 2, h / 2)
})
const chinMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.0625), new THREE.MeshBasicMaterial({ map: chin, transparent: true }))
chinMesh.position.set(0, 0.04, FRONT + 0.0024)
lidPivot.add(chinMesh)
// black display hinge strip at the bottom of the lid
const lidHinge = new THREE.Mesh(new THREE.BoxGeometry(W * 0.8, 0.03, LID_T * 0.9), hingeMat)
lidHinge.position.set(0, 0.012, 0)
lidPivot.add(lidHinge)

// the RUNTech Space mark on the back of the lid, with a soft mirror sheen
const markTex = canvasTex(512, 512, (g, w, h) => {
  g.clearRect(0, 0, w, h)
  drawMark(g, (w - (420 / 482) * 380) / 2, (h - 380) / 2, 380)
  const sheen = g.createLinearGradient(0, 0, w, h)
  sheen.addColorStop(0, 'rgba(255,255,255,0.22)')
  sheen.addColorStop(0.5, 'rgba(255,255,255,0)')
  sheen.addColorStop(1, 'rgba(255,255,255,0.12)')
  g.globalCompositeOperation = 'source-atop'
  g.fillStyle = sheen
  g.fillRect(0, 0, w, h)
})
const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: markTex, transparent: true, toneMapped: false }))
logo.position.set(0, LID_H / 2, -FRONT - 0.0012)
logo.rotation.y = Math.PI
lidPivot.add(logo)

// soft contact shadow
const shadowTex = canvasTex(256, 256, (g) => {
  const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128)
  grd.addColorStop(0, 'rgba(0,0,0,0.6)')
  grd.addColorStop(0.55, 'rgba(0,0,0,0.22)')
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 256, 256)
})
shadowTex.colorSpace = THREE.NoColorSpace
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.7, D * 1.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }))
shadow.rotation.x = -Math.PI / 2
shadow.position.y = -0.002
laptop.add(shadow)


/* ---------------- screen images ---------------- */
// Each screen image is fitted into a 16:10 canvas (cover for app screens, contain for the certificate).
const loadScreen = (src, contain) =>
  new Promise((res) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = 1600
      c.height = 1000
      const g = c.getContext('2d')
      g.fillStyle = '#f3f6fc'
      g.fillRect(0, 0, c.width, c.height)
      const s = contain ? Math.min(c.width / img.width, c.height / img.height) * 0.94 : Math.max(c.width / img.width, c.height / img.height)
      const w = img.width * s
      const h = img.height * s
      g.drawImage(img, (c.width - w) / 2, contain ? (c.height - h) / 2 : 0, w, h)
      const t = new THREE.CanvasTexture(c)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = renderer.capabilities.getMaxAnisotropy()
      res(t)
    }
    img.src = src
  })
const screens = await Promise.all([
  loadScreen('shots/tex-dashboard.jpg'),
  loadScreen('shots/tex-lesson.jpg'),
  loadScreen('shots/tex-progress.jpg'),
  loadScreen('shots/tex-certificate.jpg', true),
])
displayA.material.map = screens[0]
displayA.material.needsUpdate = true
let shown = 0
let fade = null
const showScreen = (i) => {
  if (i === shown) return
  shown = i
  displayB.material.map = screens[i]
  displayB.material.needsUpdate = true
  fade = { t0: performance.now(), i }
}

/* ---------------- the timeline ---------------- */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const seg = (p, a, b) => clamp((p - a) / (b - a))
const smooth = (t) => t * t * (3 - 2 * t)
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10)
const lerp = (a, b, t) => a + (b - a) * t
const v3 = (x, y, z) => new THREE.Vector3(x, y, z)

const OPEN = -0.24 // radians past upright when fully open
const lines = [...sec.querySelectorAll('.copy .line')]
const chips = [...sec.querySelectorAll('.chip')]
const chipPlan = [
  [0.34, 0.62],
  [0.4, 0.66],
  [0.5, 0.76],
  [0.56, 0.8],
]
let line = -1
const css = (k, v) => sec.style.setProperty(k, v)

const screenWorld = new THREE.Vector3()
const screenNormal = new THREE.Vector3()
const tmpQ = new THREE.Quaternion()

function pose(p) {
  // lid
  const open = smoother(seg(p, 0.06, 0.34))
  lidPivot.rotation.x = lerp(Math.PI / 2 - 0.006, OPEN, open)
  screenOff.material.opacity = 1 - smooth(seg(p, 0.24, 0.36))

  // laptop slowly turns while you read, then squares up for the dive
  const read = seg(p, 0.36, 0.8)
  laptop.rotation.y = lerp(-0.55, 0, smoother(seg(p, 0, 0.36))) + Math.sin(read * Math.PI) * 0.32 * (1 - seg(p, 0.76, 0.84))

  // camera: high three-quarter view -> eye level -> into the screen
  const settle = smoother(seg(p, 0, 0.36))
  const camA = v3(0.4, 6.6, 6.2)
  const camB = v3(0, 2.3, 7.4)
  const tgtA = v3(0, 0.75, -0.5)
  const tgtB = v3(0, 1.42, -0.25)
  const camPos = camA.clone().lerp(camB, settle)
  const tgt = tgtA.clone().lerp(tgtB, settle)
  camPos.x += Math.sin(read * Math.PI * 2) * 0.35
  // narrow screens: step back so the whole laptop fits the width
  const back = camera.aspect < 0.8 ? 2.05 : camera.aspect < 1.2 ? 1.35 : 1
  camPos.sub(tgt).multiplyScalar(back).add(tgt)

  const dive = smoother(seg(p, 0.8, 1))
  if (dive > 0) {
    laptop.updateMatrixWorld(true)
    displayA.getWorldPosition(screenWorld)
    displayA.getWorldQuaternion(tmpQ)
    screenNormal.set(0, 0, 1).applyQuaternion(tmpQ)
    const vFov = THREE.MathUtils.degToRad(camera.fov)
    const fitH = (SCR_H / 2) / Math.tan(vFov / 2)
    const fitW = (SCR_W / 2) / Math.tan(vFov / 2) / camera.aspect
    // wide screens: fill the view; tall phones: fit the whole screen width
    const dist = camera.aspect < 1 ? Math.max(fitH, fitW) * 1.04 : Math.min(fitH, fitW) * 0.96
    const end = screenWorld.clone().addScaledVector(screenNormal, dist)
    camPos.lerp(end, dive)
    tgt.lerp(screenWorld, dive)
  }
  camera.position.copy(camPos)
  camera.lookAt(tgt)

  // what the screen shows
  showScreen(p < 0.42 ? 0 : p < 0.6 ? 1 : p < 0.8 ? 2 : 3)

  // headline, glow, floor, finale
  const l = p < 0.3 ? 0 : p < 0.55 ? 1 : p < 0.8 ? 2 : 3
  if (l !== line) {
    line = l
    lines.forEach((el, i) => el.classList.toggle('on', i === l))
  }
  css('--p', p)
  css('--glow', String(smooth(seg(p, 0.22, 0.4)) * (1 - dive)))
  css('--floor', String(1 - dive))
  css('--copy', String(1 - seg(p, 0.84, 0.9)))
  css('--fin', String(seg(p, 0.93, 0.99)))
  sec.querySelector('.finale').style.pointerEvents = p > 0.95 ? 'auto' : 'none'

  // moments float up out of the screen
  chips.forEach((c, i) => {
    const [a, b] = chipPlan[i] ?? [2, 3]
    const t = seg(p, a, b)
    const inT = smoother(seg(t, 0, 0.3))
    const outT = seg(t, 0.82, 1)
    c.style.opacity = String(inT * (1 - outT))
    c.style.transform = `translate3d(0, ${(1 - inT) * 36 - t * 24}px, 0) scale(${0.86 + inT * 0.14})`
    c.style.filter = `blur(${(1 - inT) * 6}px)`
  })
}

/* ---------------- sizing, scroll and the render loop ---------------- */
const resize = () => {
  const w = pin.clientWidth
  const h = pin.clientHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  // keep the laptop comfortably framed on tall phone screens
  camera.fov = 30
  camera.updateProjectionMatrix()
}
addEventListener('resize', resize)
resize()

const target = () => {
  const r = sec.getBoundingClientRect()
  return clamp(-r.top / (r.height - innerHeight))
}
let p = reduce ? 0.6 : target()
let visible = true
new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '200px' }).observe(sec)

let last = performance.now()
const frame = (now) => {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if (visible) {
    const goal = reduce ? 0.6 : target()
    // critically damped follow: smooth on wheels and trackpads, never lags far behind
    p += (goal - p) * (1 - Math.exp(-dt * 7))
    if (Math.abs(goal - p) < 0.0004) p = goal
    if (fade) {
      const k = clamp((now - fade.t0) / 450)
      displayB.material.opacity = smooth(k)
      if (k >= 1) {
        displayA.material.map = screens[fade.i]
        displayA.material.needsUpdate = true
        displayB.material.opacity = 0
        fade = null
      }
    }
    pose(p)
    renderer.render(scene, camera)
  }
  requestAnimationFrame(frame)
}
sec.classList.add('gl-ready')
requestAnimationFrame(frame)
window.__laptop = (v) => {
  p = v
  pose(v)
  renderer.render(scene, camera)
}
