import { Col, Layout, Row } from 'antd'
import React, { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useSWRImmutable from 'swr/immutable'
import { fetcher } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Privacy: React.FC = () => {
  const { data } = useSWRImmutable('/documents/privacy', fetcher)

  useEffect(() => window.scrollTo(0, 0), [])

  return <>
    <Navbar />
    <Layout.Content className="container">
      <Row>
        <Col md={{ span: 20, offset: 2 }} span={24}>
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