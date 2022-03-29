import Link from '@docusaurus/Link'
import clsx from 'clsx'
import React from 'react'
import styles from './styles.module.css'

const FeatureList = [
  {
    title: 'On-Premise Variant',
    description: (
      <>
        <p>
          <img src="https://res.cloudinary.com/mgilangjanuar/image/upload/v1648438905/teledrive/Screen_Shot_2022-03-28_at_10.41.06_m7ugy3.png" alt="screenshot" />
        </p>
        <p>
          The open source project to give you what you deserve. Using the Telegram API as your unlimited storage. So, you can upload as many as you want without any limit 👌
        </p>
        <p>
          Demo applications: <a href="https://teledrive.vercel.app" target="_blank">teledrive.vercel.app</a>, or <a href="https://teledriveapp.herokuapp.com">teledriveapp.herokuapp.com</a> <em>(*expect high traffic)</em>
        </p>
      </>
    ),
  },
];

function Feature({title, description}) {
  return (
    <>
      <div className={clsx('col col--2')}></div>
      <div className={clsx('col col--8')}>
        <div className="text--center padding-horiz--md">
          <h3>{title}</h3>
          {description}
        </div>
      </div>
    </>
  );
}

export default function HomepageFeatures() {
  return (
    <>
      <section className={styles.features}>
        <div className="container">
          <div className="row">
            {FeatureList.map((props, idx) => (
              <Feature key={idx} {...props} />
            ))}
          </div>
        </div>
      </section>
      <section className={styles.features}>
        <div className="container">
          <div className="row">
            <div className={clsx('col col--2')}></div>
            <div className={clsx('col col--8')}>
              <div className="text--center padding-horiz--md">
                <h3>Easy Installation</h3>
                <pre style={{ textAlign: 'left' }}>
                  $ git clone https://github.com/mgilangjanuar/teledrive.git<br />
                  $ cd teledrive/docker<br />
                  $ docker-compose up -d
                </pre>
                <p>
                  <Link className="button button--secondary" to="/docs/intro">
                    Learn more
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className={styles.features}>
        <div className="container">
          <div className="row">
            <div className={clsx('col col--2')}></div>
            <div className={clsx('col col--8')}>
              <div className="text--center padding-horiz--md">
                <h3>Need Help?</h3>
                <p>
                  We provide a Discord server for you to get help from the community.
                </p>
                <p>
                  <a target="_blank" className="button button--secondary" href="https://discord.gg/8v26KavKa4">Join now!</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <br /><br />
    </>
  );
}
