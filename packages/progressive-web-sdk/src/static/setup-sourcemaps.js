/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* global sourceMapSupport mapSupport*/

sourceMapSupport.install({
    overrideRetrieveFile: true,
    retrieveFile: mapSupport.retrieveFile,
    overrideRetrieveSourceMap: true,
    retrieveSourceMap: mapSupport.retrieveSourceMap
})
