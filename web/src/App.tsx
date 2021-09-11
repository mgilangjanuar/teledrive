import { Layout } from 'antd'
import React from 'react'
import { Route, Switch } from 'react-router-dom'
import NotFound from './pages/errors/NotFound'
import Home from './pages/Home'

import 'antd/dist/antd.min.css'
import './App.css'

function App(): React.ReactElement {
  return (
    <Layout className="App">
      <Switch>
        <Route path="/" exact component={Home} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  )
}

export default App