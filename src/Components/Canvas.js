/* eslint-disable react-hooks/exhaustive-deps */

import React, {useState, useEffect, useRef} from 'react';
import * as THREE from 'three';

import Controls from './Controls';
import Loading from './Loading';

let light = new THREE.PointLight( 0xFFFFFF );
light.position.set(290, 250, 690);
light.castShadow = true;
let ambientLight = new THREE.AmbientLight((0xcccccc));

let scene = new THREE.Scene();
scene.add(light);
scene.add(ambientLight);

let renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setClearColor('rgb(50, 50, 50)');

export default function Canvas(props) {

  let mount = useRef(null);

  let camera = new THREE.PerspectiveCamera(props.zoom, mount.clientWidth / mount.clientHeight, 0.1, 9000);
  camera.position.set( 400, -100, 740 );
  camera.up.set(1,0,0);
  camera.lookAt( 0, 0, 0 );


  let [grayscale, setGrayscale] = useState(false);
  let [mouseIsDown, setMouseDown] = useState(false);
  let [clickX, setClickX] = useState('');
  let [rotationX, setRotationX] = useState(0);
  const [rotateMessage, displayRotateMessage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);


  let renderScene = () => {
    renderer.render(scene, camera);
    setIsLoading(false);
  };


  let onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(mount.current.clientWidth, mount.current.clientHeight);
    renderScene();
  };


  let toggleMouseDown = (e) => {
    setMouseDown(!mouseIsDown);
    setClickX(e.clientX || e.targetTouches[0].clientX);
  }

  let toggleMouseUp = () => {
    if (scene.children[2]) {
      setMouseDown(false);
      setClickX('');
      setRotationX(scene.children[2].rotation.x || 0);
    }
  }

  let rotateMap = (e) => {
    if (mouseIsDown) {
      if (scene.children[2]) {
        displayRotateMessage(false);
        scene.children[2].rotation.x = rotationX + ((clickX - (e.clientX || e.targetTouches[0].clientX))/500);
        renderScene();
      }
    }
  }

  let toggleGrayscale = () => {
    setGrayscale(!grayscale);
    if (scene.children[2]) {
      if (!grayscale) {
        scene.children[2].material = new THREE.MeshPhongMaterial({color: 'gray', flatShading: true, shininess: 1, precision: 'mediump'});
      } else {
        scene.children[2].material = new THREE.MeshPhongMaterial({vertexColors: THREE.VertexColors, color: 'white', flatShading: true, shininess: 1, precision: 'mediump'});
      }
    }
    renderScene();
  }


  let createSquares = () => {
    if (props.points.length === 0) {
      return;
    }
    let map = new THREE.PlaneBufferGeometry(Math.pow(2, props.n)+1, Math.pow(2, props.n)+1, Math.pow(2, props.n), Math.pow(2, props.n));

    let expandedArray = [];
    for (let i = 0; i < props.points.length; i++) {
      expandedArray.push(...props.points[i]);
    }

    let count = 0;
    let colors = [];

    for (let i = 0; i < map.attributes.position.array.length; i += 3) {
      map.attributes.position.array[i+2] = expandedArray[count].z;
      if (expandedArray[count].z >= 68) { // mountain peak
        colors.push((170+(Math.round(Math.random()*10)))/255);
        colors.push((170+(Math.round(Math.random()*10)))/255);
        colors.push((170+(Math.round(Math.random()*10)))/255);
      } else if (expandedArray[count].z >= 46) { // transition to mountain peak
        colors.push(Math.round(109+(expandedArray[count].z - 46)*2.5+(Math.random()*20))/255);
        colors.push(Math.round(105+(expandedArray[count].z - 46)*2.5+(Math.random()*20))/255);
        colors.push(Math.round(105+(expandedArray[count].z - 46)*2.5+(Math.random()*20))/255);
      } else if (expandedArray[count].z > 4) { // grass
        colors.push((Math.round(30+expandedArray[count].z*1.85))/255);
        colors.push((Math.round(60+(expandedArray[count].z*.9))+(Math.round(Math.random()*20)))/255);
        colors.push((Math.round(30+expandedArray[count].z*1.7))/255);
      } else if (expandedArray[count].z > 0) { // transition to sand
        colors.push((Math.round((90 - (expandedArray[count].z*14))+(Math.random()*10)))/255);
        colors.push((Math.round((120 - expandedArray[count].z*14)+(Math.random()*20)))/255);
        colors.push((Math.round((90 - expandedArray[count].z*14)+(Math.random()*10)))/255);
      } else if (expandedArray[count].z > -2) { // sand
        colors.push((Math.round(180+(Math.random()*20)))/255);
        colors.push((Math.round(180+(Math.random()*20)))/255);
        colors.push((Math.round(130+(Math.random()*20)))/255);
      } else if (expandedArray[count].z > -22) { // shallow water
        colors.push((Math.round(70 + (expandedArray[count].z + 1.2)*3))/255);
        colors.push((Math.round(70 + (expandedArray[count].z + 1.2)*3))/255);
        colors.push((Math.round(90 + (expandedArray[count].z + 1.2)*3))/255);
      } else { // deep water
        colors.push(8/255);
        colors.push(8/255);
        colors.push(28/255);
      }
      count += 1;
    }
    map.setAttribute( 'color', new THREE.Float32BufferAttribute(colors, 3));

    let material;
    if (grayscale) {
      material = new THREE.MeshPhongMaterial(
        {
          color: 'gray', flatShading: true, dithering: true
        }
      );
    } else {
      material = new THREE.MeshPhongMaterial(
        {
          vertexColors: THREE.VertexColors, flatShading: true, shininess: 1, dithering: true
        }
      );
    }

    return new THREE.Mesh(map, material);
  };


  let generateTerrain = () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      if (scene.children[2]) {
        scene.children[2].geometry.dispose();
        scene.children[2].material.dispose();
        scene.remove(scene.children[2]);
      }
      props.diamondSquare();
      let terrainMap = createSquares();
      terrainMap.castShadow = true;
      terrainMap.position.set(0, 0, 0);
      scene.add(terrainMap);
      terrainMap.rotation.x = rotationX;
      terrainMap.rotation.y = Math.PI / 2 ;
      onResize();
    }, 0);
  };


  useEffect(() => {
    renderer.setSize(mount.current.clientWidth, mount.current.clientHeight);
    window.addEventListener('resize', onResize);
    mount.current.appendChild(renderer.domElement);
    generateTerrain();
  }, []);


  useEffect(() => {
    camera.fov = props.zoom;
    onResize();
  }, [camera, props.zoom]);


  return (
    <div id="generator">
      <div id="canvas" ref={mount} onMouseDown={toggleMouseDown} onTouchStart={toggleMouseDown} onMouseUp={toggleMouseUp} onMouseOut={toggleMouseUp} onMouseMove={rotateMap} onTouchMove={rotateMap} onTouchEnd={toggleMouseUp}>

        <div className={`rotate-message-${rotateMessage}`}>
          <h3>Click and drag to rotate map</h3>
        </div>

        <Loading isLoading={isLoading}/>
      </div>

      <Controls
        grayscale={grayscale}
        n={props.n}
        setN={props.setN}
        roughness={props.roughness}
        setRoughness={props.setRoughness}
        zoom={props.zoom}
        setZoom={props.setZoom}
        toggleGrayscale={toggleGrayscale}
        generateTerrain={generateTerrain}
        isLoading={isLoading}
      />
    </div>
  )

}
