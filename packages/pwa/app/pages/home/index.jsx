import React from 'react'
import Helmet from 'react-helmet'

import Link from 'progressive-web-sdk/dist/components/link'
import ListTile from 'progressive-web-sdk/dist/components/list-tile'

const Home = () => (
    <div className="t-home">
        <Helmet>
            <title>Scaffold Home</title>
            <meta name="description" content="Homepage for the Scaffold" />
        </Helmet>
        <h1 className="u-padding-top-md u-margin-bottom-md">Homepage</h1>
        <p className="u-margin-bottom-lg">Welcome to Mobify&apos;s Project Scaffold 👋</p>
        <p className="u-margin-bottom-lg">
            Change this page by updating <code>app/pages/home/index.jsx</code>.
        </p>
        <ListTile className="pw--instructional-block">
            <Link className="pw--underline" openInNewTab href="https://dev.mobify.com/">
                Mobify&apos;s DevCenter - dev.mobify.com
            </Link>
        </ListTile>
        <ListTile className="pw--instructional-block">
            <Link
                className="pw--underline"
                openInNewTab
                href="https://dev.mobify.com/v2.x/get-started/architecture/project-scaffold/"
            >
                File layout in the Scaffold
            </Link>
        </ListTile>
        <ListTile className="pw--instructional-block">
            <Link
                className="pw--underline"
                openInNewTab
                href="https://dev.mobify.com/v2.x/get-started/architecture/universal-react-rendering/"
            >
                Universal React Rendering
            </Link>
        </ListTile>
        <ListTile className="pw--instructional-block">
            <Link
                className="pw--underline"
                openInNewTab
                href="https://dev.mobify.com/v2.x/get-started/architecture/deployment-infrastructure/"
            >
                Deployment Infrastructure
            </Link>
        </ListTile>
        <ListTile className="pw--instructional-block">
            <Link
                className="pw--underline"
                openInNewTab
                href="https://dev.mobify.com/v2.x/get-started/architecture/app-server-overview/"
            >
                App Server Overview
            </Link>
        </ListTile>
        <ListTile className="pw--instructional-block">
            <Link
                className="pw--underline"
                openInNewTab
                href="https://dev.mobify.com/v2.x/apis-and-sdks/component-library/"
            >
                Component Library
            </Link>
        </ListTile>
    </div>
)

Home.getTemplateName = () => 'home'

export default Home
