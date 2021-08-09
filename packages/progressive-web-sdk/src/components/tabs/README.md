```js static
// JS import
import {Tabs, TabsPanel} from 'progressive-web-sdk/dist/components/tabs'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/tabs/base';
```


## Example Usage

```jsx
<div>
    <Tabs activeIndex={0}>
        <TabsPanel title="Title A">
            <p>Storys to rede ar delitabill, Suppos that thai be nocht bot fabill.
            —  John Barbour</p>
        </TabsPanel>

        <TabsPanel title="Title B">
            <p>I honestly haven't thought about it much. When it comes time for me to retire, I don't think I'll know going into that season. I'll have to evaluate it at the end of each year.
            —  LaVell Edwards</p>
        </TabsPanel>

        <TabsPanel title="Title C">
            <p>Those are a success who have lived well, laughed often, and loved much; who have gained the respect of intelligent people and the love of children, who have filled their niche and accomplished their task, who leave the world better than they found it, whether by a perfect poem or a rescued soul; who never lacked appreciation of the earth's beauty or failed to express it; who looked for the best in others and gave the best they had.
            —  Ralph Waldo Emerson</p>
        </TabsPanel>

        <TabsPanel title="Title D">
            <p>Red meat is not bad for you. Now blue-green meat, that's bad for you!
            —  Tommy Smothers</p>
        </TabsPanel>
    </Tabs>
</div>
```


## Example With `isScrollable`

```jsx
<div>
    <Tabs activeIndex={0} isScrollable>
        <TabsPanel title="Title A">
            <p>Storys to rede ar delitabill, Suppos that thai be nocht bot fabill.
            —  John Barbour</p>
        </TabsPanel>

        <TabsPanel title="Title B">
            <p>I honestly haven't thought about it much. When it comes time for me to retire, I don't think I'll know going into that season. I'll have to evaluate it at the end of each year.
            —  LaVell Edwards</p>
        </TabsPanel>

        <TabsPanel title="Title C">
            <p>Those are a success who have lived well, laughed often, and loved much; who have gained the respect of intelligent people and the love of children, who have filled their niche and accomplished their task, who leave the world better than they found it, whether by a perfect poem or a rescued soul; who never lacked appreciation of the earth's beauty or failed to express it; who looked for the best in others and gave the best they had.
            —  Ralph Waldo Emerson</p>
        </TabsPanel>

        <TabsPanel title="Title D">
            <p>Red meat is not bad for you. Now blue-green meat, that's bad for you!
            —  Tommy Smothers</p>
        </TabsPanel>
    </Tabs>
</div>
```
