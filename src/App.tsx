import React from 'react';
import {
  HashRouter as Router,
  Route,
  Switch,
  withRouter,
} from 'react-router-dom';
import { config } from 'aws-sdk';
import Axios from 'axios';
import Home from './components/Home';
import FileExplorer from './components/FileExplorer';
// eslint-disable-next-line import/no-named-as-default
import NotFound from './components/NotFound';
import './App.global.css';

Axios.defaults.adapter = require('axios/lib/adapters/http');

function App() {
  config.update({
    region: 'us-west-2',
    credentials: {
      accessKeyId: 'AKIAWYVNZR5MZCL5PURC',
      secretAccessKey: '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',
    },
  });

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
