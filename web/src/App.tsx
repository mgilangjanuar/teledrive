import React from 'react'
import { Route, Switch } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'

import Home from './pages/Home'
import NotFound from './pages/NotFound'
import { theme } from './styles/theme'

function App(): React.ReactElement {
  return (
    <ChakraProvider theme={theme}>
      <Switch>
        <Route path="/" exact component={Home} />
        <Route component={NotFound} />
      </Switch>
    </ChakraProvider>
  )
}

export default App
