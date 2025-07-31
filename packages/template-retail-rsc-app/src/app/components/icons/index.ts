import type {ReactElement} from 'react'
import type {IconBaseProps, IconType} from 'react-icons'
import {
    BsCart3,
    BsChevronDown,
    BsChevronLeft,
    BsChevronRight,
    BsFacebook,
    BsInstagram,
    BsSearch,
    BsTwitterX,
    BsX,
    BsYoutube
} from 'react-icons/bs'

type StrictIconType = (props: IconBaseProps) => ReactElement

const toStrict = (icon: IconType): StrictIconType => icon as StrictIconType

export const Cart = toStrict(BsCart3)
export const ChevronDown = toStrict(BsChevronDown)
export const ChevronRight = toStrict(BsChevronRight)
export const ChevronLeft = toStrict(BsChevronLeft)
export const Close = toStrict(BsX)
export const Facebook = toStrict(BsFacebook)
export const Instagram = toStrict(BsInstagram)
export const Search = toStrict(BsSearch)
export const TwitterX = toStrict(BsTwitterX)
export const Youtube = toStrict(BsYoutube)
