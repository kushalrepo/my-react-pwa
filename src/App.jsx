import React from 'react';
import ReactDOM from 'react-dom/client';
import DuolingoStyleQuiz from './DuolingoStyleQuiz';

function App() {
  return (
    <div>
      <DuolingoStyleQuiz />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
