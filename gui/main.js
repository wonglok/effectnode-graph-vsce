import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useRef, useState } from 'react'
import { Canvas, useFrame } from 'react-three-fiber'
import { EffectNodeEditor } from "./compos/EffectNodeEditor";

let vscode = window.acquireVsCodeApi();
let init = {}

window.SCRIPTS.forEach(({ url, name }) => {
  init[name] = null
  setInterval(() => {
    fetch(url).then(e => e.text())
      .then(text => {
        if (init[name] !== null) {
          if (init[name] !== text.length) {
            vscode.postMessage({ type: 'reload' })
          }
        }
        init[name] = text.length
      })
  }, 500)
})

function Box (props) {
  // This reference will give us direct access to the mesh
  const mesh = useRef()

  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)

  // Rotate mesh every frame, this is outside of React without overhead
  useFrame(() => {
    mesh.current.rotation.x = mesh.current.rotation.y += 0.01
  })

  return (
    <mesh
      {...props}

      ref={mesh}
      scale={active ? [1.5, 1.5, 1.5] : [1, 1, 1]}
      onClick={(event) => {
        setActive(!active)
      }}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}>
      <boxBufferGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'red' : 'green'} />
    </mesh>
  )
}

function MyScene () {
  return <scene background={'#bababa'}>
    <ambientLight />
    <pointLight position={[10, 10, 10]} />
    <Box position={[-1.2, 0, 0]} />
    <Box position={[1.2, 0, 0]} />
  </scene>
}

export function App () {
  let [initState, setInitState] = useState();

  useEffect(() => {
    let onMsg = (e) => {
      if (e.data.type === 'provide') {
        window.removeEventListener('message', onMsg)
        setInitState(e.data.doc)
      }
    }

    window.addEventListener('message', onMsg)
    if (!initState) {
      vscode.postMessage({ type: 'provide' })
    }
  }, [initState])

  // let getID = () => `_${(Math.random() * 100000000).toFixed(0)}`

  let onAutoSave = (v) => {
    vscode.postMessage({ type: 'autosave', doc: v })
  }

	return <div style={{ height: '100%', backgroundColor: '#bababa' }}>
    {initState && <EffectNodeEditor initState={initState} onAutoSave={onAutoSave}>

    </EffectNodeEditor>}
    {/* <Canvas>
      <MyScene></MyScene>
    </Canvas> */}
  </div>
}

if (window.document) {
  ReactDOM.render(
    <App></App>,
    window.document.getElementById('root')
  )
}
