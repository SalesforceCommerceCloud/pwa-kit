// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
// /* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
//
// import React from 'react'
// import PropTypes from 'prop-types'
// import {getBuildOrigin} from '../../utils/assets'
// import DebugPartial from './partial/debug-partial'
// import Sheet from '../sheet'
// import Button from '../button'
// import IconLabel from '../icon-label'
// import * as utils from '../../utils/debug'
// import {version} from '../../../package.json'
//
// /**
//  * DebugInfo is a development component to show debug information on a build.
//  */
//
// class DebugInfoDev extends React.Component {
//     constructor(props) {
//         super(props)
//         this.state = {
//             coverage: '25%',
//             bundleId: null,
//             isDebugOpen: false,
//             effect: 'slide-right',
//             buildOriginUrl: null,
//             isPreview: null,
//             ssrTiming: null,
//             target: null,
//             projectId: null,
//             cloudURL: null
//         }
//     }
//
//     componentDidMount() {
//         const {shouldRender} = this.props
//
//         if (shouldRender()) {
//             const buildOriginUrl = getBuildOrigin()
//             const isPreview = utils.isUsingMobifyPreview()
//             const ssrTiming = utils.getSSRTimingInformation()
//             const info = utils.getProjectIDandTargetFromURL(buildOriginUrl)
//             const target = (info || {}).target
//             const projectId = (info || {}).projectId
//             const cloudURL =
//                 target && projectId
//                     ? `https://cloud.mobify.com/projects/${projectId}/publishing/${target}`
//                     : undefined
//
//             // Get the bundleId if we haven't got it yet
//             if (this.state.bundleId === null || this.state.bundleId === undefined) {
//                 const url = utils.getMobifyScriptSrc()
//                 utils.getBundleID(url).then((bundleId) => {
//                     this.setState({bundleId})
//                 })
//             }
//             this.setState({
//                 buildOriginUrl,
//                 isPreview,
//                 ssrTiming,
//                 target,
//                 projectId,
//                 cloudURL
//             })
//         }
//     }
//
//     toggleModal(bool) {
//         this.setState({
//             isDebugOpen: bool
//         })
//     }
//
//     render() {
//         const {shouldRender} = this.props
//
//         const {
//             isDebugOpen,
//             effect,
//             buildOriginUrl,
//             isPreview,
//             ssrTiming,
//             target,
//             projectId,
//             cloudURL
//         } = this.state
//
//         const customHeader = (
//             <div className="pw-debug-info__header">
//                 <div className="pw-debug-info__header-actions-start">
//                     <Button
//                         onClick={() => this.toggleModal(false)}
//                         innerClassName="pw-debug-info__button"
//                     >
//                         <IconLabel label="Close" iconName="close" iconSize="medium" />
//                     </Button>
//                 </div>
//                 <div className="pw-debug-info__slider-container">
//                     <h3 className="pw-debug-info__modal-title">Debug Info</h3>
//                 </div>
//                 <div className="pw-debug-info__header-actions-end" />
//             </div>
//         )
//
//         return (
//             shouldRender() && (
//                 <div className="pw-debug-info">
//                     <Button
//                         title="debugInfo toggle button"
//                         onClick={() => this.toggleModal(true)}
//                         innerClassName="pw-debug-info__button pw--toggle"
//                     >
//                         <IconLabel label="Debug" iconName="settings" iconSize="medium" />
//                     </Button>
//                     <Sheet
//                         id="pw-debug-info"
//                         open={isDebugOpen}
//                         onDismiss={() => this.toggleModal(false)}
//                         effect={effect}
//                         headerContent={customHeader}
//                     >
//                         <DebugPartial
//                             className={this.props.className}
//                             buildOriginUrl={buildOriginUrl}
//                             isPreview={isPreview}
//                             target={target}
//                             projectId={projectId}
//                             bundleId={this.state.bundleId}
//                             cloudURL={cloudURL}
//                             version={version}
//                             ssrTiming={ssrTiming}
//                         />
//                     </Sheet>
//                 </div>
//             )
//         )
//     }
// }
//
// DebugInfoDev.defaultProps = {
//     shouldRender: () => true
// }
//
// DebugInfoDev.propTypes = {
//     /**
//      * A CSS class name to be applied to the `DebugPartial` component's `<div>` wrapper.
//      */
//     className: PropTypes.string,
//
//     /**
//      * DEPRECATED
//      * Function to determine whether DebugInfo should be rendered. Defaults to function returning true.
//      */
//     shouldRender: PropTypes.func
// }
//
// export default DebugInfoDev
