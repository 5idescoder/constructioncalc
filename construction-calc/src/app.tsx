import React from 'react';
import ReactDOM from 'react-dom/client';
import WallPreview from './components/WallPreview';

const App = () => {
  return (
    <div>
      <h1>Construction Materials Calculator</h1>
      <WallPreview 
        length={20} 
        width={10} 
        height={8} 
        doors={[]} 
        windows={[]} 
        updateDoor={() => {}} 
        updateWindow={() => {}} 
      />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);