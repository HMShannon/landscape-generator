import React, {Component} from 'react';
import * as THREE from 'three';

import Controls from './Controls';
import Loading from './Loading';


export default class Canvas extends Component {

  state = {
    grayscale: false,
    n : 7,
    roughness: .6,
    zoom: 12,
    mouseIsDown: false,
    clickX: '',
    clickY: '',
    rotationX: 0,
    cornerVals: [],
    points: [],
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
      clickX: e.clientX,
      clickY: e.clientY,
    });
  }


  setMouseUp = () => {
    if (this.scene.children[2]) {
      this.setState({
        mouseIsDown: false,
        clickX: '',
        clickY: '',
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
        this.scene.children[2].rotation.x = this.state.rotationX + ((this.state.clickX - e.clientX)/500);
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


  setProperty = (property, val) => {
    this.setState({
      [property]: val
    }, () => {
      if (property === 'zoom') {
        if (this.camera) {
          this.camera.fov = val;
        }
        this.camera.updateProjectionMatrix();
        this.renderScene();
      }
    });
  }


  generateArray = (corner1, corner2, corner3, corner4) => {
    let pointsArray = [];
    for (let i = 0; i < (Math.pow(2, this.state.n)+1); i++) {
      let newRow = [];
      for (let j = 0; j < (Math.pow(2, this.state.n)+1); j++) {
        newRow.push({z: null});
      }
      pointsArray.push(newRow);
    }
    pointsArray[0][0].z = corner1;
    pointsArray[pointsArray.length-1][0].z = corner2;
    pointsArray[pointsArray.length-1][pointsArray.length-1].z = corner3;
    pointsArray[0][pointsArray.length-1].z = corner4;
    return pointsArray;
  }


  diamondSquare = (cornerVals) => {

    let pointsArray = this.generateArray(...cornerVals);
    let step = 1;

    let pointDistance = pointsArray.length-1;

    while (step < (2 * this.state.n + 1)) {
      if (step % 2 !== 0) { // diamond step, use all 4 points
        for (let i = 0; i < pointsArray.length; i+= pointDistance) {
          for (let j = 0; j < pointsArray[i].length; j += pointDistance) {
            if (j+pointDistance >= pointsArray[i].length || i+pointDistance >= pointsArray.length) {
              break;
            }
            let pointsToUse = [];
            pointsToUse.push(pointsArray[i][j]); // top left of current square
            pointsToUse.push(pointsArray[i][j+pointDistance]);
            pointsToUse.push(pointsArray[i+pointDistance][j]);
            pointsToUse.push(pointsArray[i+pointDistance][j+pointDistance]); // bottom right of current square

            this.calculateZ(pointsToUse, pointsArray[Math.round(i+pointDistance/2)][Math.round(j+pointDistance/2)], step, pointDistance);
          }
        }
      } else { // square step, use only 3 points if on edge
        for (let i = 0; i < pointsArray.length; i += pointDistance) {
          for (let j = 0; j < pointsArray[i].length; j += pointDistance) {
            let pointsToUse = [];
            if (pointsArray[i][j].z !== null) {
              continue;
            } else {
              if (i-pointDistance >= 0) {
                pointsToUse.push(pointsArray[i-pointDistance][j]);
              }
              if (j+pointDistance < pointsArray.length) {
                pointsToUse.push(pointsArray[i][j+pointDistance]);
              }
              if (i+pointDistance < pointsArray.length) {
                pointsToUse.push(pointsArray[i+pointDistance][j]);
              }
              if (j-pointDistance >= 0) {
                pointsToUse.push(pointsArray[i][j-pointDistance]);
              }
              this.calculateZ(pointsToUse, pointsArray[i][j], step, pointDistance);
            }
          }
        }
      }
      if (step % 2 !== 0) {
        pointDistance = pointDistance/2;
      }
      if (pointDistance < 1) {
        pointDistance = 1;
      }
      step++;
    }

    let despikedPointsArray = this.removeSpikes(pointsArray);

    this.setState({
      points: despikedPointsArray
    });
  }


  calculateZ = (points, pointToCalc, n, pointDistance) => {
    points = points.filter((point) => point.z !== null);

    let z = 0;
    for (let i = 0; i < points.length; i++) {
      z += points[i].z;
    }
    z = z/points.length;

    let randomAmount;

    randomAmount = Math.random() * (pointDistance * this.state.roughness) - (pointDistance/this.state.n);

    if (n === 1) {
      randomAmount *= .8;
    }

    if (Math.random() < 0.5) {
      z -= randomAmount;
    } else {
      z += randomAmount;
    }


    pointToCalc.z = z;
  }


  getAdjacent = (array, pointI, pointJ) => {
    let adjacentPoints = [];
    for (let i = pointI-1; i <= pointI+1; i++) {
      if (i < 0) {
        continue;
      }
      if (i > array.length-1) {
        break;
      }
      for (let j = pointJ-1; j <= pointJ+1; j++) {
        if (j < 0) {
          continue;
        }
        if ((i === pointI && j === pointJ) || j > array.length-1) {
          continue;
        }

        adjacentPoints.push(array[i][Math.round(j)].z);
      }
    }
    return adjacentPoints;
  }


  removeSpikes = (pointsArray) => {

    for (let i = 0; i < pointsArray.length; i++) {
      for (let j = 0; j < pointsArray[i].length; j++) {

        let adjacentHeights = this.getAdjacent(pointsArray, i, j);
        let averageSurroundingHeight = adjacentHeights.reduce((curr, total) => total += curr)/adjacentHeights.length;
        let spikeVal = 0;

        for (let k = 0; k < adjacentHeights.length; k++) {
          pointsArray[i][j].z = adjacentHeights.reduce((curr, total) => total += curr)/adjacentHeights.length;
        }
      }
    }

    return pointsArray;
  }


  createSquares() {
    if (this.state.points.length === 0) {
      return;
    }

    let map = new THREE.PlaneGeometry(Math.pow(2, this.state.n)+1, Math.pow(2, this.state.n)+1, Math.pow(2, this.state.n), Math.pow(2, this.state.n));

    let expandedArray = [];
    for (let i = 0; i < this.state.points.length; i++) {
      expandedArray.push(...this.state.points[i]);
    }
    for (let i = 0; i < map.vertices.length; i++) {
      map.vertices[i].z = expandedArray[i].z;
    }


    map.faces.forEach((face, index) => {

      let vertA = map.vertices[face.a];
      let vertB = map.vertices[face.b];
      let vertC = map.vertices[face.c];

      let vertices = [vertA, vertB, vertC];


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

    let terrainMap = new THREE.Mesh(map, material);
    return terrainMap;
  }


  initialize = () => {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(this.state.zoom, this.mount.clientWidth / this.mount.clientHeight, 0.1, 9000);
    this.camera.position.set( 400, 0, 640 );
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
      let corners = [0, 0, 0, 0];
      corners.forEach((corner, i) => {
        let val = Math.random() * this.state.n * 2;
        if (Math.random() < .5) {
          corners[i] -= val;
        } else {
          corners[i] += val;
        }
      });
      if (this.scene.children[2]) {
        console.log(this.scene.children);
        this.scene.children[2].geometry.dispose();
        this.scene.children[2].material.dispose();
      }
      this.scene.remove(this.scene.children[2]);

      setTimeout(() => {
        this.diamondSquare(corners);
        let terrainMap = this.createSquares();

        terrainMap.castShadow = true;
        terrainMap.position.set(0, 0, 0);
        this.scene.add(terrainMap);
        terrainMap.rotation.x = this.state.rotationX;
        terrainMap.rotation.y = Math.PI / 2;


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


  renderScene = () => {
    this.renderer.render(this.scene, this.camera);
  }


  render() {
    return (
      <div id="generator">
        <div id="canvas" ref={(mount) => this.mount = mount} onMouseDown={this.setMouseDown} onMouseUp={this.setMouseUp} onMouseOut={this.setMouseUp} onMouseMove={this.rotateMap}>

          <div className={`rotate-message-${this.state.displayRotateMessage}`}>
            <h3>Click and drag to rotate map</h3>
          </div>

          <Loading isLoading={this.state.isLoading}/>
        </div>

        <Controls
          grayscale={this.state.grayscale}
          n={this.state.n}
          roughness={this.state.roughness}
          zoom={this.state.zoom}
          toggleGrayscale={this.toggleGrayscale}
          setProperty={this.setProperty}
          setFov={this.setFov}
          generateTerrain={this.generateTerrain}
          remove={this.removeFromScene}
          isLoading={this.state.isLoading}
        />
      </div>
    )
  }

}
