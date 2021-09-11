import React from 'react';

const Controls = (props) => {
  return (
    <div id="controls">

      <div id="grayscale-toggle" className="control-item">
        <p>Grayscale:</p>
        <input type="checkbox" onChange={props.toggleGrayscale} />
      </div>

      <div id="map-size-toggle" className="control-item">
        <p>Map size:</p>
        <input type="range" min="7" max="9" value={props.n} onChange={(e) => props.setN(e.target.value)}/>
      </div>

      <div id="roughness-toggle" className="control-item">
        <p>Roughness:</p>
        <input type="range" min=".1" max=".7" value={props.roughness} step=".1" onChange={(e) => props.setRoughness(e.target.value)}/>
      </div>

      <button id="generate-button" className="control-item" disabled={props.isLoading} onClick={props.generateTerrain}>Generate Terrain</button>

    </div>
  );
}


export default Controls;
