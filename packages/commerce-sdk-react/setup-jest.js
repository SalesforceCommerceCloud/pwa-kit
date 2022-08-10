import '@testing-library/jest-dom'
import {configure} from '@testing-library/dom'

// Default testing library timeout is too short for serial network calls
configure({
    asyncUtilTimeout: 10000,
})
