// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'TeleDrive',
  tagline: 'Your free unlimited cloud storage service using the Telegram API.',
  url: 'https://teledriveapp.com',
  baseUrl: '/',
  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'https://res.cloudinary.com/mgilangjanuar/image/upload/v1648461015/teledrive/favicon_zuhgjb.png',
  organizationName: 'mgilangjanuar', // Usually your GitHub org/user name.
  projectName: 'teledrive', // Usually your repo name.
  // deploymentBranch: 'staging',

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/mgilangjanuar/teledrive/edit/staging/docs/'
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/mgilangjanuar/teledrive/edit/staging/blog/'
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: '',
        logo: {
          alt: 'Logo',
          src: 'https://res.cloudinary.com/mgilangjanuar/image/upload/v1648461000/teledrive/logoteledrive-white_u8hevi.png',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'Getting Started',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/mgilangjanuar/teledrive',
            label: 'GitHub',
            position: 'right',
            
          },
          {
            href: 'https://opencollective.com/teledrive/contribute',
            label: 'Donate',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Tutorial',
                to: '/docs/intro',
              },
              {
                label: 'FAQ',
                to: '/docs/faq',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Twitter',
                href: 'https://twitter.com/teledriveapp',
              },
              {
                label: 'Discord',
                href: 'https://discord.gg/8v26KavKa4'
              },
              {
                label: 'Youtube',
                href: 'https://www.youtube.com/channel/UCg9WsNAHdOpo8SyM8JHGuZQ',
              }
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/mgilangjanuar/teledrive',
              },
              {
                label: 'Donate',
                href: 'https://opencollective.com/teledrive/contribute',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} TeleDrive, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },
    }),
};

module.exports = config;