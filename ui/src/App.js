import React from 'react';
import './App.css';
import './lib-ui.css';
import './theme.css';
import LandingScreen from './screens/landing-screen';
import TreeScreen  from './screens/tree-screen';
import ConfigEditor from './screens/config-editor';
import AuthScreen from './screens/auth-screen';
import EditTree from './screens/edit-tree'
import { BrowserRouter as Router, Route, Link } from "react-router-dom";


class App extends React.Component {
  render() {
    return(
      <Router>
      <div>
        <Route path="/" exact component={LandingScreen} />
        <Route path="/createtree/" component={TreeScreen} />
        <Route path="/config" component={ConfigEditor} />
        <Route path="/auth" component={AuthScreen} />
        <Route path="/edittree" component={EditTree} />
      </div>
    </Router>
    )
  }
}

export default App;
