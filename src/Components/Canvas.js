import React, {Component} from 'react';
import * as THREE from 'three';

import Controls from './Controls';
import Loading from './Loading';


export default class Canvas extends Component {

  state = {
    grayscale: false,
    mouseIsDown: false,
    clickX: '',
    rotationX: 0,
    displayRotateMessage: false,
    isLoading: false
  }


  onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.mount.clientWidth, this.mount.clientHeight);
    this.renderScene();
  }


  setMouseDown = (e) => {
    this.setState({
      mouseIsDown: !this.state.mouseIsDown,
      clickX: e.clientX || e.targetTouches[0].clientX
    });
  }


  setMouseUp = () => {
    if (this.scene.children[2]) {
      this.setState({
        mouseIsDown: false,
        clickX: '',
        rotationX: this.scene.children[2].rotation.x || 0
      });
    }
  }


  rotateMap = (e) => {
    if (this.state.mouseIsDown) {
      if (this.scene.children[2]) {
        this.setState({
          displayRotateMessage: false
        });
        this.scene.children[2].rotation.x = this.state.rotationX + ((this.state.clickX - (e.clientX || e.targetTouches[0].clientX))/500);
        this.renderScene();
      }
    }
  }


  toggleGrayscale = () => {
    this.setState({
      grayscale: !this.state.grayscale
    }, () => {
      if (this.scene.children[2]) {
        if (this.state.grayscale) {
          this.scene.children[2].material = new THREE.MeshPhongMaterial({color: 'gray', flatShading: true});
        } else {
          this.scene.children[2].material = new THREE.MeshPhongMaterial({vertexColors: THREE.VertexColors, color: 'white', flatShading: true, shininess: 1});
        }
      }
      this.renderScene();
    });
  }


  createSquares() {

    if (this.props.points.length === 0) {
      return;
    }

    let map = new THREE.PlaneGeometry(Math.pow(2, this.props.n)+1, Math.pow(2, this.props.n)+1, Math.pow(2, this.props.n), Math.pow(2, this.props.n));


    let expandedArray = [];
    for (let i = 0; i < this.props.points.length; i++) {
      expandedArray.push(...this.props.points[i]);
    }
    for (let i = 0; i < map.vertices.length; i++) {
      map.vertices[i].z = expandedArray[i].z;
    }


    map.faces.forEach((face, index) => {

      let vertices = [map.vertices[face.a], map.vertices[face.b], map.vertices[face.c]];

      vertices.forEach((vertex, i) => {
        let groundColor;
        if (vertex.z >= 68) { // mountain peak
          groundColor = new THREE.Color(`rgb(${170+(Math.round(Math.random()*10))}, ${170+(Math.round(Math.random()*10))}, ${170+(Math.round(Math.random()*10))})`);
        } else if (vertex.z >= 46) { // transition to mountain peak
          groundColor = new THREE.Color(`rgb(${Math.round(109+(vertex.z - 46)*2.5+(Math.random()*20))}, ${Math.round(105+(vertex.z - 46)*2.5+(Math.random()*20))}, ${Math.round(105+(vertex.z - 46)*2.5+(Math.random()*20))})`);
        } else if (vertex.z > 4) { // grass
          groundColor = new THREE.Color(`rgb(${Math.round(30+vertex.z*1.85)}, ${Math.round(60+(vertex.z*.9))+(Math.round(Math.random()*20))}, ${Math.round(30+vertex.z*1.7)})`);
        } else if (vertex.z > 0) { // transition to sand
          groundColor = new THREE.Color(`rgb(${Math.round((90 - (vertex.z*14))+(Math.random()*10))}, ${Math.round((120 - vertex.z*14)+(Math.random()*20))}, ${Math.round((90 - vertex.z*14)+(Math.random()*10))})`);
        } else if (vertex.z > -2) { // sand
          groundColor = new THREE.Color(`rgb(${Math.round(180+(Math.random()*20))}, ${Math.round(180+(Math.random()*20))}, ${Math.round(130+(Math.random()*20))})`);
        } else if (vertex.z > -22) { // shallow water
          groundColor = new THREE.Color(`rgb(${Math.round(70 + (vertex.z + 1.2)*3)}, ${Math.round(70 + (vertex.z + 1.2)*3)}, ${Math.round(90 + (vertex.z + 1.2)*3)})`);
        } else { // deep water
          groundColor = new THREE.Color(`rgb(8, 8, 28)`);
        }


        face.vertexColors[i] = groundColor;

      });
    });

    let material;
    if (this.state.grayscale) {
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
  }


  initialize = () => {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(this.props.zoom, this.mount.clientWidth / this.mount.clientHeight, 0.1, 9000);
    this.camera.position.set( 400, -100, 740 );
    this.camera.up.set(1,0,0);
    this.camera.lookAt( 0, 0, 0 );

    let light = new THREE.PointLight( 0xFFFFFF );
    light.position.set(290, 250, 690);
    light.castShadow = true;
    let ambientLight = new THREE.AmbientLight((0xcccccc));

    this.scene.add(light);
    this.scene.add(ambientLight);

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setClearColor('rgb(50, 50, 50)');
    this.renderer.setSize(this.mount.clientWidth, this.mount.clientHeight);

    this.mount.appendChild(this.renderer.domElement);
  }


  generateTerrain = () => {

    if (this.state.isLoading) {
      return;
    }

    this.setState({
      isLoading: true
    }, () => {
      if (this.scene.children[2]) {
        this.scene.children[2].geometry.dispose();
        this.scene.children[2].material.dispose();
      }
      this.scene.remove(this.scene.children[2]);

      setTimeout(() => {
        this.props.diamondSquare();
        let terrainMap = this.createSquares();

        terrainMap.castShadow = true;
        terrainMap.position.set(0, 0, 0);
        this.scene.add(terrainMap);
        terrainMap.rotation.x = this.state.rotationX;
        terrainMap.rotation.y = Math.PI / 2 ;


        this.onResize();
        this.setState({
          isLoading: false
        });
      }, 0)
    })

  }


  componentDidMount() {
    window.addEventListener('resize', this.onResize);

    this.initialize();

    setTimeout(() => {
      this.generateTerrain();
      this.setState({
        displayRotateMessage: true
      });
    }, 0);

  }

  componentDidUpdate(prevProps) {
    if (this.props.zoom !== prevProps.zoom) {
      this.camera.fov = this.props.zoom;
      this.camera.updateProjectionMatrix();
    }

    let propKeys = Object.keys(prevProps);

    // don't call renderScene if the only thing that has changed is the rotationX prop
    for (let i = 0; i < propKeys.length; i++) {
      if (this.props[propKeys[i]] !== prevProps[propKeys[i]]) {
        if (propKeys[i] !== 'rotationX') {
          this.renderScene();
          break;
        }
      }
    }
  }


  renderScene = () => {
    this.renderer.render(this.scene, this.camera);
  }


  render() {
    return (
      <div id="generator">
        <div id="canvas" ref={(mount) => this.mount = mount} onMouseDown={this.setMouseDown} onTouchStart={this.setMouseDown} onMouseUp={this.setMouseUp} onMouseOut={this.setMouseUp} onMouseMove={this.rotateMap} onTouchMove={this.rotateMap} onTouchEnd={this.setMouseUp}>

          <div className={`rotate-message-${this.state.displayRotateMessage}`}>
            <h3>Click and drag to rotate map</h3>
          </div>

          <Loading isLoading={this.state.isLoading}/>
        </div>

        <Controls
          grayscale={this.state.grayscale}
          n={this.props.n}
          roughness={this.props.roughness}
          zoom={this.props.zoom}
          toggleGrayscale={this.toggleGrayscale}
          setProperty={this.props.setProperty}
          generateTerrain={this.generateTerrain}
          isLoading={this.state.isLoading}
        />
      </div>
    )
  }

}
