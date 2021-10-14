import { Layout } from 'antd'
import React, { lazy, Suspense, useEffect } from 'react'
import { Route, Switch, useLocation } from 'react-router-dom'

import 'antd/dist/antd.min.css'
import './App.less'

const Dashboard = lazy(
  () => import(/* webpackChunkName: 'DashboardPage' */ './pages/dashboard')
)
const Home = lazy(
  () => import(/* webpackChunkName: 'HomePage' */ './pages/Home')
)
const View = lazy(
  () => import(/* webpackChunkName: 'ViewPage' */ './pages/View')
)
const Login = lazy(
  () => import(/* webpackChunkName: 'LoginPage' */ './pages/Login')
)
const Terms = lazy(
  () => import(/* webpackChunkName: 'TermsPage' */ './pages/Terms')
)
const Privacy = lazy(
  () => import(/* webpackChunkName: 'PrivacyPage'  */ './pages/Privacy')
)
const Pricing = lazy(
  () => import(/* webpackChunkName: 'PricingPage'  */ './pages/Pricing')
)
const Contact = lazy(
  () => import(/* webpackChunkName: 'ContactPage'  */ './pages/Contact')
)
const Faq = lazy(() => import(/* webpackChunkName: 'FaqPage' */ './pages/Faq'))
const NotFound = lazy(
  () => import(/* webpackChunkName: 'NotFoundPage' */ './pages/errors/NotFound')
)

function App(): React.ReactElement {
  // if (location.host !== 'teledriveapp.com' && localStorage.getItem('environment') !== 'staging') {
  //   location.replace(location.href.replace(location.host, 'teledriveapp.com'))
  // }
  const { pathname } = useLocation()
  useEffect(() => document.querySelector('.App')?.scrollIntoView(), [pathname])

  return (
    <Layout className="App">
      <Suspense fallback={<>/</>}>
        <Switch>
          <Route path="/dashboard/:type?" exact component={Dashboard} />
          <Route path="/view/:id" exact component={View} />
          <Route path="/login" exact component={Login} />
          <Route path="/terms" exact component={Terms} />
          <Route path="/privacy" exact component={Privacy} />
          <Route path="/pricing" exact component={Pricing} />
          <Route path="/contact" exact component={Contact} />
          <Route path="/faq" exact component={Faq} />
          <Route path="/" exact component={Home} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  )
}

export default App
