import React from 'react';

const Loading = (props) => {
  return (
    <div className={`loading-block loading-block-${props.isLoading}`}>
      <div id="loading-image">
        <h1>Loading...</h1>
      </div>
    </div>
  );
}

export default Loading;
