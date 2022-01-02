import { Col, Layout, Row } from 'antd'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useSWRImmutable from 'swr/immutable'
import { fetcher } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Refund: React.FC = () => {
  const { data } = useSWRImmutable('/documents/refund', fetcher)
  const { data: me } = useSWRImmutable('/users/me', fetcher)

  return <>
    <Navbar page="refund" user={me} />
    <Layout.Content className="container">
      <Row>
        <Col lg={{ span: 18, offset: 3 }} md={{ span: 20, offset: 2 }} span={24}>
          <ReactMarkdown className="refund" remarkPlugins={[remarkGfm]}>
            {data?.document}
          </ReactMarkdown>
        </Col>
      </Row>
    </Layout.Content>
    <Footer />
  </>
}

export default Refund