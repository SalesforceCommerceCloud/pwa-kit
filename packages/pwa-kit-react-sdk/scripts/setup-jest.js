/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import 'raf/polyfill' // fix requestAnimationFrame issue with polyfill
import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import fetch from 'jest-fetch-mock'

Enzyme.configure({adapter: new Adapter()})

// Mock Fetch
global.fetch = fetch
