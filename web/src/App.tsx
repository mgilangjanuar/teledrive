import React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'

import Home from './pages/Home'
import NotFound from './pages/NotFound'
import { theme } from './styles/theme'

import Album from './pages/dashboard/Album'
import Photo from './pages/dashboard/Photo'
import Login from './pages/Login'
import ManageFile from './pages/dashboard/ManageFile'

function App(): React.ReactElement {
  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/login" exact component={Login} />
          <Route path="/dashboard" exact component={ManageFile} />
          <Route path="/album/:id" exact component={Album} />
          <Route path="/photo/:id" exact component={Photo} />
          <Route component={NotFound} />
        </Switch>
      </BrowserRouter>
    </ChakraProvider>
  )
}

export default App
