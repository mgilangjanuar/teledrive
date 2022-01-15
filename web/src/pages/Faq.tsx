import { Col, Divider, Layout, Row, Typography } from 'antd'
import React from 'react'
import useSWRImmutable from 'swr/immutable'
import { fetcher } from '../utils/Fetcher'

const Faq: React.FC = () => {
  const { data: contributors } = useSWRImmutable('/github/contributors', fetcher)

  return <>
    <Layout.Content className="container">
      <Row>
        <Col lg={{ span: 18, offset: 3 }} md={{ span: 20, offset: 2 }} span={24}>
          <Typography.Title>Frequently Asked Questions</Typography.Title>
          <Divider />
          <Typography.Title level={5}>
            Q: What is TeleDrive?
          </Typography.Title>
          <Typography.Paragraph>
            A: If you ever heard about cloud storage services like Google Drive, OneDrive, iCloud, Dropbox &mdash; TeleDrive is one of them, you can upload photos, videos, documents, or any files for free. But, what makes TeleDrive different? We're using the <a href="https://core.telegram.org/api#telegram-api" target="_blank">Telegram API</a>, so you can do uploads without limit and free.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Telegram allows us to <a href="https://core.telegram.org/api/obtaining_api_id" target="_blank">create our Telegram application</a> for free as long as it does not violate the <a href="https://core.telegram.org/api/terms" target="_blank">terms</a>. So, TeleDrive is a third-party application of Telegram that utilizes their APIs for cloud storage service.
          </Typography.Paragraph>
          <Typography.Title level={5}>
            Q: Who is TeleDrive for?
          </Typography.Title>
          <Typography.Paragraph>
            A: Everyone who deserves free unlimited cloud storage services. Developers, students, etc. We just compare the irrational pricing for others cloud storage services: <a href="https://one.google.com/about/plans" target="_blank">Google Drive</a>, <a href="https://one.google.com/about/plans" target="_blank">OneDrive</a>, <a href="https://www.dropbox.com/individual/plans-comparison" target="_blank">Dropbox</a>, <a href="https://support.apple.com/en-us/HT201238" target="_blank">iCloud</a> &mdash;
            and we offer you a free service for saving your media privately without limit to balance the world.
          </Typography.Paragraph>
          <Typography.Title level={5}>
            Q: How it works?
          </Typography.Title>
          <Typography.Paragraph>
            A: For authentication and authorization flow, we're using <a href="https://core.telegram.org/api/auth" target="_blank">this flow</a>. First, we need a valid phone number and hit <a href="https://core.telegram.org/method/auth.sendCode" target="_blank">send code</a> method to the Telegram API, then <a href="https://core.telegram.org/method/auth.signIn" target="_blank">sign in</a> with the 5 digits code that is sent to the user's Telegram account.
            If the code has expired, we use <a href="https://core.telegram.org/method/auth.resendCode" target="_blank">resend code</a> method. After that, we got the session key. TeleDrive will wrap the session with the <a href="https://jwt.io/" target="_blank">JWT</a> method to make you securely access other private endpoints, like upload, download, get file lists, etc. We do not store your session in any storage or database.
          </Typography.Paragraph>
          <Typography.Paragraph>
            For upload and download flow, we're using the <a href="https://core.telegram.org/method/upload.getFile" target="_blank">get file</a> and <a href="https://core.telegram.org/method/upload.saveBigFilePart" target="_blank">save big file part</a> methods. For every file a user uploads, it gets uploaded in chunks and passed to Telegram. So, you can't reload or close the browser if it's still uploading. All files that you upload will be
            saved in the Saved Messages in your Telegram application. TeleDrive does not save your file on the server or anywhere else. So, only you that can access those files unless you share them with someone.
          </Typography.Paragraph>
          <Typography.Title level={5}>
            Q: How secure is TeleDrive?
          </Typography.Title>
          <Typography.Paragraph>
            A: As we explain in the previous question, we fully using the Telegram API for the authentication process. For the authorization flow, we using multiple verifications to hit the private endpoints in the TeleDrive APIs. First, we need to verify the auth token with the secret token that is saved in the secret environment variable in the server. Then, we check the session to the Telegram API to revalidate whether it's you.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Tl;dr it's safe.
          </Typography.Paragraph>
          <Typography.Title level={5}>
            Q: How does Telegram generate money if they have unlimited cloud storage?
          </Typography.Title>
          <Typography.Paragraph>
            A: Pavel Durov, as a Telegram founder, said “All the features that are currently free will stay free”. And they will add some new features for business teams or power users. <a href="https://t.me/durov/142" target="_blank">Source</a>.
          </Typography.Paragraph>
          <Typography.Title level={5}>
            Q: Who are the people behind TeleDrive?
          </Typography.Title>
          <Typography.Paragraph>
            A: This project is initiated by M Gilang Januar, a crazy person with the crazy idea on <a href="https://twitter.com/mgilangjanuar/status/1431207019269160960" target="_blank">Aug 27, 2021</a>. And because this is an open-source project, many people want to join to help his idea there are {contributors?.contributors.filter((person: any) => person.login !== 'mgilangjanuar').map((person: any) => <><a href={person.html_url} target="_blank">{person.login}</a>, </>)} etc.
          </Typography.Paragraph>
          <Typography.Title level={5}>
            Q: There's illegal content on TeleDrive. How do I take it down?
          </Typography.Title>
          <Typography.Paragraph>
            A: You can report it to this link: <a href="https://teledriveapp.com/contact?intent=report" target="_blank">https://teledriveapp.com/contact?intent=report</a>. All the reports from users will be received by the creator via their Telegram account.
          </Typography.Paragraph>
          <Typography.Title level={5}>
            Q: Will you have ads in my dashboard? Or sell my data?
          </Typography.Title>
          <Typography.Paragraph>
            A: We won't sell any data for now and forever.
          </Typography.Paragraph>
          <Typography.Paragraph>
            But for ads, we’ll add them to the homepage and not in the user’s dashboard. So, users won't get distracted by ads or tracked by the files they upload.
          </Typography.Paragraph>
          <Typography.Title level={5}>
            Q: Will TeleDrive be free forever?
          </Typography.Title>
          <Typography.Paragraph>
            A: Same as the Telegram strategy, all the basic features that are currently free will stay free for now and forever. We’ll add some new features in the future for business teams or power users.
          </Typography.Paragraph>
          <Typography.Title level={5}>
            Q: How do I contact the creator directly?
          </Typography.Title>
          <Typography.Paragraph>
            A: You can leave a comprehensive message at this link: <a href="https://teledriveapp.com/contact" target="_blank">https://teledriveapp.com/contact</a>. We have a bot that forwarded all messages from this platform to the creator’s private message directly. We’ll get back to you via Telegram and we’re very happy to hear your feedback, idea, suggestion, question, or anything else.
          </Typography.Paragraph>
          <Typography.Title level={5}>
            Q: Will TeleDrive be gone at any time?
          </Typography.Title>
          <Typography.Paragraph>
            A: Sadly, yes. If we’re run out of the operational costs for server and domain renewal fee, we’ll stop this service with notification to all users at least 3 months before it’s gone.
          </Typography.Paragraph>
          <Typography.Title level={5}>
            Q: How can I contribute to TeleDrive?
          </Typography.Title>
          <Typography.Paragraph>
            A: You can become a sponsor for this project by leaving a message to this link: <a href="https://teledriveapp.com/contact?intent=sponsor" target="_blank">https://teledriveapp.com/contact?intent=sponsor</a> or via <a href="https://opencollective.com/teledrive/contribute" target="_blank">Open Collective</a>. Of course, we’ll add you to the sponsor list on the homepage. If you’re a developer, you can contribute to our <a href="https://github.com/mgilangjanuar/teledrive" target="_blank">source code</a> on GitHub <em>(Note. The creator can make the repository private at any time)</em>, send us a pull request, issue, or simply give a star to the repository.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Contact us anytime if you would like to help us in other ways.
          </Typography.Paragraph>
        </Col>
      </Row>
    </Layout.Content>
  </>
}

export default Faq