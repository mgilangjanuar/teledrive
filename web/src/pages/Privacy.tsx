import { Col, Layout, Row } from 'antd'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import useSWRImmutable from 'swr/immutable'
import remarkGfm from 'remark-gfm'
import { fetcher } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Privacy: React.FC = () => {
  const { data } = useSWRImmutable('/documents/privacy', fetcher)
  return <>
    <Navbar />
    <Layout.Content className="container">
      <Row>
        <Col md={{ span: 20, offset: 2 }} span={24}>
          <ReactMarkdown className="tos" remarkPlugins={[remarkGfm]}>
            {data?.document}
          </ReactMarkdown>
          <div>
          </div>
        </Col>
      </Row>
    </Layout.Content>
    <Footer />
  </>
}

export default Privacy