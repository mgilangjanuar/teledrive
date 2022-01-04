import { Col, Layout, Row } from 'antd'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useSWRImmutable from 'swr/immutable'
import { fetcher } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Privacy: React.FC = () => {
  const { data } = useSWRImmutable('/documents/privacy', fetcher)
  const { data: me } = useSWRImmutable('/users/me', fetcher)

  return <>
    <Navbar page="privacy" user={me?.user} />
    <Layout.Content className="container">
      <Row>
        <Col lg={{ span: 18, offset: 3 }} md={{ span: 20, offset: 2 }} span={24}>
          <ReactMarkdown className="tos" remarkPlugins={[remarkGfm]}>
            {data?.document}
          </ReactMarkdown>
        </Col>
      </Row>
    </Layout.Content>
    <Footer />
  </>
}

export default Privacy