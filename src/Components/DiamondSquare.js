import React, {Component} from 'react';

import Canvas from './Canvas';


export default class DiamondSquare extends Component {

  state = {
    n: 7,
    roughness: .6,
    zoom: 14,
    points: []
  }

  setProperty = (property, val) => {
    this.setState({
      [property]: val
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


  diamondSquare = () => {

    let corners = [0, 0, 0, 0];
    corners.forEach((corner, i) => {
      let val = Math.random() * this.state.n * 2;
      if (Math.random() < .5) {
        corners[i] -= val;
      } else {
        corners[i] += val;
      }
    });

    let pointsArray = this.generateArray(...corners);
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

    randomAmount = Math.random() * pointDistance * this.state.roughness * .7;

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

        pointsArray[i][j].z = averageSurroundingHeight;
      }
    }

    return pointsArray;
  }

  render() {
    return <Canvas
              n={this.state.n}
              roughness={this.state.roughness}
              zoom={this.state.zoom}
              points={this.state.points}
              diamondSquare={this.diamondSquare}
              setProperty={this.setProperty} />
  }

}
