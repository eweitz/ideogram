import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import Ideogram from 'ideogram';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to Ideogram.js in React!</h1>
        </header>
        <AppIdeogram/>
      </div>
    );
  }
}

class AppIdeogram extends Component {

  componentDidMount() {
    return new Ideogram({
      organism: 'human',
      dataDir: 'https://unpkg.com/ideogram@0.13.0/dist/data/bands/native/',
      container: '#ideo-container'
    });
  }

  render() {
    return (
      <div id="ideo-container"></div>
    );
  }
}

export default App;
