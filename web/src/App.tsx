import { MobileOutlined, TwitterOutlined } from '@ant-design/icons'
import { Button, Layout, notification, Result, Typography } from 'antd'
import pwaInstallHandler from 'pwa-install-handler'
import React, { lazy, Suspense, useEffect } from 'react'
import { useThemeSwitcher } from 'react-css-theme-switcher'
import { Helmet } from 'react-helmet'
import { Redirect, Route, Switch, useLocation } from 'react-router-dom'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'
import Footer from './pages/components/Footer'
import Navbar from './pages/components/Navbar'
import { fetcher } from './utils/Fetcher'

import 'antd-country-phone-input/dist/index.css'
import moment from 'moment'

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
  () => import(/* webpackChunkName: 'ViewPage' */ './pages/view/index')
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

const Faq = lazy(
  () => import(/* webpackChunkName: 'FaqPage' */ './pages/Faq')
)

const NotFound = lazy(
  () => import(/* webpackChunkName: 'NotFoundPage' */ './pages/errors/NotFound')
)

function App(): React.ReactElement {
  const { pathname } = useLocation()
  const { switcher } = useThemeSwitcher()
  const { data } = useSWR('/utils/maintenance', fetcher)
  const { data: me, error: errorMe, mutate: mutateMe } = useSWRImmutable('/users/me', fetcher)

  useEffect(() => document.querySelector('.App')?.scrollIntoView(), [pathname])

  useEffect(() => {
    if (
      me?.user.settings?.theme === 'dark' &&
      (
        moment().format('l') === '2/2/2022' ||
        me?.user.plan && me?.user.plan !== 'free'
      )
    ) {
      switcher({ theme: 'dark' })
    } else if (me?.user.settings?.theme === 'light') {
      switcher({ theme: 'light' })
    } else {
      switcher(
        { theme: moment().format('l') === '2/2/2022' ? 'dark' : 'light' }
      )
    }
  }, [me])

  useEffect(() => {
    pwaInstallHandler.addListener(canInstall => {
      if (
        canInstall &&
        (
          !localStorage.getItem('install') ||
          new Date().getTime() - Number(
            localStorage.getItem('install')
          ) > 5 * 8.64e+7
        )
      ) {
        notification.info({
          duration: null,
          message: 'Install App',
          description: <>
            <Typography.Paragraph>
              You can install the app on your device for a better experience.
            </Typography.Paragraph>
            <Typography.Paragraph style={{ textAlign: 'right' }}>
              <Button type="primary" onClick={pwaInstallHandler.install} icon={<MobileOutlined />} shape="round">
                Install Now
              </Button>
            </Typography.Paragraph>
          </>,
          onClose: () => localStorage.setItem('install', new Date().getTime().toString())
        })
      }
    })
  }, [])

  return (
    <Layout className="App">
      <Helmet>
        <meta name="theme-color" content={me?.user.settings?.theme === 'dark' ? '#1F1F1F' : '#0088CC'} />
      </Helmet>
      {data?.maintenance ? <div style={{ minHeight: '100vh', paddingTop: '20vh' }}>
        <Result
          status="warning"
          title="This site is under maintenance"
          subTitle="We're preparing to serve you better."
          extra={
            <Button shape="round" type="primary" icon={<TwitterOutlined />} href="https://twitter.com/teledriveapp">
              Follow us for updates
            </Button>
          }
        />
      </div> : <>
        {!/^\/view\/.*/gi.test(window.location.pathname) && <Navbar user={me?.user} />}
        <div style={{ minHeight: '88vh' }}>
          <Suspense fallback={<></>}>
            <Switch>
              <Route path="/dashboard/:type?" exact component={Dashboard} />
              <Route path="/settings" exact component={() => <Settings me={me} error={errorMe} mutate={mutateMe} />} />
              <Route path="/view/:id" exact component={View} />
              <Route path="/login" exact>
                {me?.user ? <Redirect to="/dashboard" /> : <Login me={me} />}
              </Route>
              <Route path="/terms" exact component={Terms} />
              <Route path="/refund" exact component={Refund} />
              <Route path="/privacy" exact component={Privacy} />
              <Route path="/pricing" exact component={() => <Pricing me={me} />} />
              <Route path="/contact" exact component={() => <Contact me={me} />} />
              <Route path="/faq" exact component={Faq} />
              <Route path="/" exact>
                {new URLSearchParams(window.location.search).get('source') === 'pwa' ? <Redirect to="/dashboard" /> : <Home me={me} />}
              </Route>
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </div>
        {!/^\/view\/.*/gi.test(window.location.pathname) && <Footer me={me} />}
      </>}
    </Layout>
  )
}

export default App
