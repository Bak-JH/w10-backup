import './App.css';
import './routes'
import AppRoute from './routes';
import { HashRouter } from 'react-router-dom'

function App() {
  const style = {
    display       : "flex", 
    width         : "479px",
    height        : "320px",
    'user-select' : "none",
    'cursor'      : "hidden"
  }

  return (
    <div className="App">
      <header className="App-header">
        <div style={style}>
          <HashRouter>
            <AppRoute></AppRoute>
          </HashRouter>
        </div>
      </header>
    </div>
  );
}

export default App;
