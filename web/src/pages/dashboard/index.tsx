import { Col, Layout, Row } from 'antd'
import React, { useEffect } from 'react'
import { useHistory } from 'react-router'
import useSWR from 'swr'
import { fetcher } from '../../utils/Fetcher'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

const Dashboard: React.FC = () => {
  const location = useHistory()
  const { data: me, error: errorMe } = useSWR('/users/me', fetcher)

  useEffect(() => {
    if (errorMe) {
      location.replace('/')
    }
  }, [errorMe])

  return <>
    <Navbar user={me?.user} />
    <Layout.Content>
      <Row style={{ marginTop: '20vh' }}>
        <Col lg={{ span: 8, offset: 8 }} md={{ span: 12, offset: 6 }} span={20} offset={2}>

        </Col>
      </Row>

    </Layout.Content>
    <Footer />
  </>
}

export default Dashboard