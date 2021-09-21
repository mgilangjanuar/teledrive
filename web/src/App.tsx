import { Layout } from 'antd'
import React from 'react'
import { Route, Switch } from 'react-router-dom'
import NotFound from './pages/errors/NotFound'
import Dashboard from './pages/dashboard'
import Contact from './pages/Contact'
import Home from './pages/Home'
import Login from './pages/Login'
import Pricing from './pages/Pricing'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import View from './pages/View'

import 'antd/dist/antd.min.css'
import './App.css'

function App(): React.ReactElement {
  return (
    <Layout className="App">
      <Switch>
        <Route path="/dashboard/:type?" exact component={Dashboard} />
        <Route path="/view/:id" exact component={View} />
        <Route path="/login" exact component={Login} />
        <Route path="/terms" exact component={Terms} />
        <Route path="/privacy" exact component={Privacy} />
        <Route path="/pricing" exact component={Pricing} />
        <Route path="/contact" exact component={Contact} />
        <Route path="/" exact component={Home} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  )
}

export default App