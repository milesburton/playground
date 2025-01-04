import React from 'react';
import './App.css';

const poolGameImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'; // Truncated for brevity
const tankGameImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'; // Truncated for brevity

function App() {
  return (
    <div className="game-selection">
      <div className="game-option">
        <img src={poolGameImage} alt="Pool Game" />
        <button>Play Pool Game</button>
      </div>
      <div className="game-option">
        <img src={tankGameImage} alt="Tank Game" />
        <button>Play Tank Game</button>
      </div>
    </div>
  );
}

export default App;
