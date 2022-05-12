import { MobileOutlined, TwitterOutlined } from '@ant-design/icons'
import { Button, Layout, notification, Result, Typography } from 'antd'
import 'antd-country-phone-input/dist/index.css'
import pwaInstallHandler from 'pwa-install-handler'
import React, { lazy, Suspense, useEffect, useState } from 'react'
import { useThemeSwitcher } from 'react-css-theme-switcher'
import { Helmet } from 'react-helmet'
import LoadingScreen from 'react-loading-screen'
import { Redirect, Route, Switch, useLocation } from 'react-router-dom'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'
import Footer from './pages/components/Footer'
import Navbar from './pages/components/Navbar'
import { fetcher } from './utils/Fetcher'

const Startup = lazy(
  () => import(/* webpackChunkName: 'StartupPage' */ './pages/Startup')
)
const Dashboard = lazy(
  () => import(/* webpackChunkName: 'DashboardPage' */ './pages/dashboard')
)
const Settings = lazy(
  () => import(/* webpackChunkName: 'SettingsPage' */ './pages/Settings')
)
const View = lazy(
  () => import(/* webpackChunkName: 'ViewPage' */ './pages/view/index')
)
const Login = lazy(
  () => import(/* webpackChunkName: 'LoginPage' */ './pages/Login')
)
const Admin = lazy(
  () => import(/* webpackChunkName: 'AdminPage' */ './pages/admin/index')
)
const NotFound = lazy(
  () => import(/* webpackChunkName: 'NotFoundPage' */ './pages/errors/NotFound')
)

function App(): React.ReactElement {
  const { pathname } = useLocation()
  const { switcher } = useThemeSwitcher()
  const { data } = useSWR('/utils/maintenance', fetcher)
  const { data: me, error: errorMe, mutate: mutateMe } = useSWRImmutable('/users/me', fetcher)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => document.querySelector('.App')?.scrollIntoView(), [pathname])

  useEffect(() => {
    if (me?.user.settings?.theme === 'light') {
      switcher({ theme: 'light' })
    } else {
      switcher({ theme: 'dark' })
    }
  }, [me, errorMe])

  useEffect(() => {
    pwaInstallHandler.addListener(canInstall => {
      if (canInstall && (!localStorage.getItem('install') || new Date().getTime() - Number(localStorage.getItem('install')) > 5 * 8.64e+7)) {
        notification.info({
          key: 'appInstallInfo',
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
    pwaInstallHandler.removeListener(_canInstall => {
      notification.close('appInstallInfo')
    })
  }, [])

  useEffect(() => {
    window.addEventListener('message', event => {
      if (event.data.type === 'files') {
        localStorage.setItem('files', JSON.stringify(event.data.files))
      }
    })
  }, [])

  useEffect(() => {
    const url = localStorage.getItem('BASE_URL')
    if (url && !/^http/.test(url) || /\/startup\?reset\=1/.test(window.location.href)) {
      localStorage.removeItem('BASE_URL')
    } else if (url && url !== window.location.origin) {
      window.location.replace(url as string)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('load', () => setTimeout(() => {
      setLoading(false)
    }, 1500))
  }, [])

  return (
    <LoadingScreen
      loading={loading}
      bgColor='#141414'
      spinnerColor='#9ee5f8'
      textColor='#676767'
      logoSrc='/logo192.png'>
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
          {!/^\/view\/.*/gi.test(pathname) && <Navbar user={me?.user} />}
          <div style={{ minHeight: '88vh' }}>
            <Suspense fallback={<></>}>
              <Switch>
                <Route path="/startup" exact component={Startup} />
                <Route path="/dashboard/:type?" exact component={Dashboard} />
                <Route path="/settings" exact component={() => <Settings me={me} error={errorMe} mutate={mutateMe} />} />
                <Route path="/view/:id" exact component={View} />
                <Route path="/login" exact>
                  {me?.user && !localStorage.getItem('experimental') ? <Redirect to="/dashboard" /> : <Login me={me} />}
                </Route>
                <Route path="/admin" exact component={() => <Admin me={me} errorMe={errorMe} />} />
                <Route path="/" exact>
                  <Redirect to="/dashboard" />
                </Route>
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </div>
          {/^\/view\/.*/gi.test(pathname) || /\/startup/.test(pathname) ? <></> : <Footer me={me} />}
        </>}
      </Layout>
    </LoadingScreen>
  )
}

export default App
