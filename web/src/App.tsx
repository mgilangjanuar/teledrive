import { TwitterOutlined } from '@ant-design/icons'
import { Button, Layout, Result } from 'antd'
import React, { lazy, Suspense, useEffect } from 'react'
import { Redirect, Route, Switch, useLocation } from 'react-router-dom'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'
import { fetcher } from './utils/Fetcher'

const Dashboard = lazy(
  () => import(/* webpackChunkName: 'DashboardPage' */ './pages/dashboard')
)
const Settings = lazy(
  () => import(/* webpackChunkName: 'SettingsPage' */ './pages/Settings')
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
const Refund = lazy(
  () => import(/* webpackChunkName: 'RefundPage' */ './pages/Refund')
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
  const { data: me, error: errorMe, mutate: mutateMe } = useSWRImmutable('/users/me', fetcher)

  useEffect(() => {
    if (me?.user.plan === 'premium' && localStorage.getItem('theme') === 'dark') {
      require('./App.dark.less')
    } else {
      require('./App.less')
    }
    require('antd-country-phone-input/dist/index.css')
  }, [me])

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
          <Route path="/dashboard/:type?" exact component={(props: any) => <Dashboard {...props} me={me} errorMe={errorMe} />} />
          <Route path="/settings" exact component={() => <Settings me={me} error={errorMe} mutate={mutateMe} />} />
          <Route path="/view/:id" exact component={(props: any) => <View {...props} me={me} errorMe={errorMe} />} />
          <Route path="/login" exact>
            {me?.user ? <Redirect to="/dashboard" /> : <Login me={me} />}
          </Route>
          <Route path="/terms" exact component={() => <Terms me={me} />} />
          <Route path="/refund" exact component={() => <Refund me={me} />} />
          <Route path="/privacy" exact component={() => <Privacy me={me} />} />
          <Route path="/pricing" exact component={() => <Pricing me={me} />} />
          <Route path="/contact" exact component={() => <Contact me={me} />} />
          <Route path="/faq" exact component={() => <Faq me={me} />} />
          <Route path="/" exact>
            {new URLSearchParams(window.location.search).get('source') === 'pwa' ? <Redirect to="/dashboard" /> : <Home me={me} />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>}
    </Layout>
  )
}

export default App
