import React from 'react';
// import ReactDOM from 'react-dom';
import { createRoot} from 'react-dom/client'
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

// ReactDOM.render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <App />
//     </BrowserRouter>
//   </React.StrictMode>,
//   document.getElementById('root')
// );



// Use createRoot instead of ReactDOM.render
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(
  // <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  /* </React.StrictMode> */
);

