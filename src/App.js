import React from 'react';
import { BrowserRouter, Route, Switch, Link } from 'react-router-dom';
import './App.css';

import ViewerComponent from './ViewerComponent';
import UploadComponent from './UploadComponent';
import MainComponent from './MainComponent';

function App() {
  return (
    <div>
      <BrowserRouter>
        <div style={{ width: '500px', margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
          <Link to='/viewer'>Viewer Component</Link>
          <Link to='/upload'>Upload</Link>
          <Link to='/'>MainComponent</Link>
        </div>
        <Switch>
          <Route path='/viewer/:id' component={ViewerComponent} />
          <Route path='/upload' component={UploadComponent} />
          <Route path='/' component={MainComponent} />
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;
