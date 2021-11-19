import { TwitterOutlined } from '@ant-design/icons'
import { Button, Layout, Result } from 'antd'
import React, { lazy, Suspense, useEffect } from 'react'
import { Route, Switch, useLocation } from 'react-router-dom'
import useSWR from 'swr'
import { fetcher } from './utils/Fetcher'

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
  const { pathname } = useLocation()
  useEffect(() => document.querySelector('.App')?.scrollIntoView(), [pathname])
  const { data } = useSWR('/utils/maintenance', fetcher)

  return (
    <Layout className="App">
      {data?.maintenance ? <Result
        status="warning"
        title="This site is under maintenance"
        subTitle="We're preparing to serve you better."
        extra={
          <Button shape="round" type="primary" icon={<TwitterOutlined />} href="https://twitter.com/teledriveapp">
            Follow us for updates
          </Button>
        }
      /> : <Suspense fallback={<></>}>
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
      </Suspense>}
    </Layout>
  )
}

export default App
