import React, {Fragment} from 'react'

const SamplePage = () => {
    return (
        <Fragment>
            <h1>Welcome to the Sample Page 👋</h1>
            <hr/>
            <p>If you are reading this, it means that this page was successfully added to your base project. 🎉</p>
            <p>
                This <i>application extension</i> was installed by simply running the below command in your PWA-Kit project. 
                Its dependancies were automatically installed as was the extension added to the projects extensions array.
            </p>
            <div style={{border: '1px solid darkGray', backgroundColor: 'lightgray', width: 'calc(100% - 10px)', padding: '5px'}}>
                <code>
                    &gt; npm install @salesforce/extension-sample --legacy-peer-deps*<br/>
                    &gt; Downloading npm package... <br/>
                    &gt; Installing extention... <br/>
                    &gt; Finished. <br/>
                    &gt; Congratulations! The Sample extension was successfully installed! Please visit https://www.npmjs.com/package/@salesforce/extension-sample for more information on how to use this extension.
                </code>
            </div>
        </Fragment>
    )
}

export default SamplePage