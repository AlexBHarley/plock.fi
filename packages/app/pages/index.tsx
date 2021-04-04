import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { WithLayout } from '../components';

import {
  Transfer,
  Earn,
  Vote,
  Lend,
  Settings,
  Stream,
  Swap,
  Dashboard,
} from '../_pages';

export default function App() {
  return (
    <Router>
      <WithLayout>
        <Switch>
          <Route exact path="/" component={Dashboard} />
          <Route path="/transfer" component={Transfer} />
          <Route path="/earn" component={Earn} />
          <Route path="/vote" component={Vote} />
          <Route path="/lend" component={Lend} />
          <Route path="/settings" component={Settings} />
          <Route path="/stream" component={Stream} />
          <Route path="/swap" component={Swap} />
        </Switch>
      </WithLayout>
    </Router>
  );
}
