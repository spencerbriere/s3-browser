import React from 'react';
import {
  HashRouter as Router,
  Route,
  Switch,
  withRouter,
} from 'react-router-dom';
import Home from './components/Home';
import FileExplorer from './components/FileExplorer';
// eslint-disable-next-line import/no-named-as-default
import NotFound from './components/NotFound';
import './App.global.css';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/home" exact component={Home} />
        <Route path="/files" exact component={FileExplorer} />
        <Route path="/" component={NotFound} />
      </Switch>
    </Router>
  );
}
export default withRouter(App);
