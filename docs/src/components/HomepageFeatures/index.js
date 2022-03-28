import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'On-Premise Variant',
    description: (
      <>
        <p>
          The open source project to give you what you deserve. Using the Telegram API as your unlimited storage. So, you can upload as many as you want without any limit 👌
        </p>
        <img src="https://res.cloudinary.com/mgilangjanuar/image/upload/v1648438905/Screen_Shot_2022-03-28_at_10.41.06_m7ugy3.png" alt="screenshot" />
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
          <p>{description}</p>
        </div>
      </div>
    </>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
