/* eslint-disable react-hooks/exhaustive-deps */

import React, {useState, useEffect, useRef} from 'react';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import Controls from './Controls';
import Loading from './Loading';

let light = new THREE.PointLight(0xFFFFFF, 0.8, 0, 2);
light.position.set(300, 100, 0);
light.castShadow = true;

let ambientLight = new THREE.AmbientLight((0xEEEEEE));

let scene = new THREE.Scene();
scene.add(light);
scene.add(ambientLight);

let renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setClearColor('rgb(50, 50, 50)');

export default function Canvas(props) {

  let mount = useRef(null);

  let camera = new THREE.PerspectiveCamera(14, mount.clientWidth / mount.clientHeight, 0.1, 9000);
  camera.position.set( 400, -100, 740 );
  camera.up.set(1,0,0);
  camera.lookAt( 0, 0, 0 );

  let [grayscale, setGrayscale] = useState(false);
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

  let toggleGrayscale = () => {
    setGrayscale(!grayscale);
    if (scene.children[2]) {
      if (!grayscale) {
        scene.children[2].material = new THREE.MeshPhongMaterial({color: 'gray', flatShading: true, shininess: 1, precision: 'lowp'});
      } else {
        scene.children[2].material = new THREE.MeshPhongMaterial({vertexColors: THREE.VertexColors, color: 'white', flatShading: true, shininess: 1, precision: 'lowp'});
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
      if (expandedArray[count].z >= 74.5) { // mountain peak
        colors.push((176+(Math.round(Math.random()*15)))/255);
        colors.push((174+(Math.round(Math.random()*15)))/255);
        colors.push((174+(Math.round(Math.random()*15)))/255);
      } else if (expandedArray[count].z >= 46) { // transition to mountain peak
        colors.push(Math.round(109+(expandedArray[count].z - 48)*2.5+(Math.random()*20))/255);
        colors.push(Math.round(105+(expandedArray[count].z - 48)*2.5+(Math.random()*20))/255);
        colors.push(Math.round(105+(expandedArray[count].z - 48)*2.5+(Math.random()*20))/255);
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
        colors.push((Math.round(70 + (expandedArray[count].z + 1.2)*2.5))/255);
        colors.push((Math.round(70 + (expandedArray[count].z + 1.2)*2.5))/255);
        colors.push((Math.round(90 + (expandedArray[count].z + 1.2)*2.5))/255);
      } else { // deep water
        colors.push(18/255);
        colors.push(18/255);
        colors.push(38/255);
      }
      count += 1;
    }
    map.setAttribute( 'color', new THREE.Float32BufferAttribute(colors, 3));

    let material;
    if (grayscale) {
      material = new THREE.MeshPhongMaterial(
        {
          color: 'gray', flatShading: true, dithering: true, precision: 'lowp'
        }
      );
    } else {
      material = new THREE.MeshPhongMaterial(
        {
          vertexColors: THREE.VertexColors, flatShading: true, shininess: 1, dithering: true, precision: 'lowp'
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
      terrainMap.rotation.y = Math.PI / 2 ;
      onResize();
    }, 0);
  };

  useEffect(() => {
    renderer.setSize(mount.current.clientWidth, mount.current.clientHeight);
    window.addEventListener('resize', onResize);
    mount.current.appendChild(renderer.domElement);
    renderer.domElement.addEventListener('click', () => displayRotateMessage(false));
    renderer.domElement.addEventListener('touchend', () => displayRotateMessage(false));
    renderer.domElement.addEventListener('touchcancel', () => displayRotateMessage(false));

    let controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = 1.5;
    controls.minDistance = 100;
    controls.maxDistance = 2100;
    controls.rotateSpeed = 0.25;

    function animate() {
      controls.update();
      window.requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    window.requestAnimationFrame(animate);
    generateTerrain();
  }, []);

  return (
    <div id="generator">
      <div id="canvas" ref={mount}>

        <div className={`rotate-message-${rotateMessage}`}>
          <h3>Click and drag to rotate, pinch or mousewheel to zoom</h3>
        </div>

        <Loading isLoading={isLoading}/>
      </div>

      <Controls
        grayscale={grayscale}
        n={props.n}
        setN={props.setN}
        roughness={props.roughness}
        setRoughness={props.setRoughness}
        toggleGrayscale={toggleGrayscale}
        generateTerrain={generateTerrain}
        isLoading={isLoading}
      />
    </div>
  )

}
