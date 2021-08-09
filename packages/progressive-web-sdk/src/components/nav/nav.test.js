/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import Nav from './index.jsx'

describe('Nav renders without errors', () => {
    test('with no props', () => {
        const wrapper = mount(<Nav />)
        expect(wrapper.length).toBe(1)
    })

    test('with a single child', () => {
        const path = '/'
        const root = {title: 'root', path}
        const wrapper = mount(<Nav root={root} path={path} />)
        expect(wrapper.length).toBe(1)
    })

    test('with multiple children', () => {
        const path = '/'
        const root = {
            title: 'root',
            path,
            children: [{title: 'one', path: '/thing-one/'}, {title: 'two', path: '/thing-two/'}]
        }
        const wrapper = mount(<Nav root={root} path={path} />)
        expect(wrapper.length).toBe(1)
    })

    test('allowing arbitrary content in the menu', () => {
        const wrapper = mount(
            <Nav>
                <h1>This has nothing to do with the nav!</h1>
            </Nav>
        )
        expect(wrapper.html()).toBe(
            '<nav class="pw-nav"><h1>This has nothing to do with the nav!</h1></nav>'
        )
    })
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Nav />)

    expect(wrapper.prop('className').startsWith('pw-nav')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Nav />)

    expect(wrapper.prop('className').includes('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    const name = 'name'
    const wrapper = shallow(<Nav className={name} />)
    expect(wrapper.prop('className').includes(name)).toBe(true)
})

describe('mapTree appropriately returns an enriched navigation tree', () => {
    test('for an undefined root', () => {
        expect(Nav.mapTree(undefined)).toEqual([undefined, false])
    })

    test('for a root with no children', () => {
        const root = {title: 'root', path: '/'}
        expect(Nav.mapTree(root)).toEqual([Object.assign({}, root, {originalPath: '/'}), false])
    })

    test('for a root with children', () => {
        const child = {title: 'child', path: '/child/'}
        const root = {title: 'root', path: '/', children: [child]}
        const clonedChild = Object.assign({}, child, {originalPath: child.path})
        const clone = Object.assign({}, root, {originalPath: root.path, children: [clonedChild]})
        expect(Nav.mapTree(root, false)).toEqual([clone, false])
    })

    test('returns true for tree with duplicate paths', () => {
        const child1 = {title: 'c', path: '/child/'}
        const child2 = {title: 'c', path: '/child/'}
        const root = {title: 'root', path: '/', children: [child1, child2]}
        const childClone1 = Object.assign({}, child1, {originalPath: child1.path})
        const childClone2 = Object.assign({}, child2, {
            originalPath: child2.path,
            path: `${child2.path}#`
        })
        const clone = Object.assign({}, root, {
            originalPath: root.path,
            children: [childClone1, childClone2]
        })

        expect(Nav.mapTree(root)).toEqual([clone, true])
    })
})

describe('indexTree appropriately returns a map of the navigation tree passed to it', () => {
    test('for an undefined root', () => {
        expect(Nav.indexTree(undefined)).toEqual({})
    })

    test('for a root with no children', () => {
        const node = {title: 'root', path: '/', originalPath: '/'}
        expect(Nav.indexTree(node)).toEqual({
            '/': {depth: 0, key: '0', node, parent: node}
        })
    })

    test('for a root with children', () => {
        const node = {
            title: 'root',
            path: '/',
            originalPath: '/',
            children: [{title: 'child', path: '/child/', originalPath: '/child/'}]
        }
        expect(Nav.indexTree(node)).toEqual({
            '/': {depth: 0, key: '0', node, parent: node},
            '/child/': {depth: 1, key: '0.0', node: node.children[0], parent: node}
        })
    })
})

describe('allows navigation through the navigation tree', () => {
    test('moving one level up in the tree', () => {
        const root = {
            title: 'root',
            path: '/',
            children: [{title: 'c1', path: '/child-1/'}, {title: 'c2', path: '/child-2/'}]
        }
        jest.useFakeTimers()
        const onPathChange = jest.fn()
        const wrapper = shallow(<Nav root={root} path="/child-2/" onPathChange={onPathChange} />)
        const instance = wrapper.instance()
        instance.goBack()
        jest.runAllTimers()
        expect(onPathChange).toHaveBeenCalledTimes(1)
        expect(onPathChange).toHaveBeenLastCalledWith('/', false, 'click', '/')
    })

    test('going to an arbitrary node by path', () => {
        const root = {
            title: 'root',
            path: '/',
            children: [{title: 'c1', path: '/child-1/'}, {title: 'c2', path: '/child-2/'}]
        }
        jest.useFakeTimers()
        const onPathChange = jest.fn()
        const wrapper = shallow(<Nav root={root} path="/child-2/" onPathChange={onPathChange} />)
        const instance = wrapper.instance()
        instance.goToPath('/child-1/')
        jest.runAllTimers()
        expect(onPathChange).toHaveBeenCalledTimes(1)
        expect(onPathChange).toHaveBeenLastCalledWith('/child-1/', true, 'click', '/child-1/')
    })

    test('ignores requests for invalid paths', () => {
        const root = {
            title: 'root',
            path: '/',
            children: [{title: 'c1', path: '/child-1/'}, {title: 'c2', path: '/child-2/'}]
        }
        jest.useFakeTimers()
        const onPathChange = jest.fn()
        const wrapper = shallow(<Nav root={root} path="/child-2/" onPathChange={onPathChange} />)
        const instance = wrapper.instance()
        instance.goToPath('/invalid/')
        jest.runAllTimers()
        expect(onPathChange).toHaveBeenCalledTimes(0)
    })
})

test('revises its node map if a new root is passed', () => {
    const root1 = {title: 'root', path: '/'}
    const root2 = {
        title: 'root',
        path: '/',
        children: [{title: 'c1', path: '/child-1/'}, {title: 'c2', path: '/child-2/'}]
    }

    const wrapper = mount(<Nav root={root1} />)

    const clone1 = Object.assign({}, root1, {originalPath: root1.path})
    expect(wrapper.state('nodes')).toEqual({
        '/': {depth: 0, key: '0', node: clone1, parent: clone1}
    })

    wrapper.setProps({root: root2})

    const childClone1 = Object.assign({}, root2.children[0], {originalPath: root2.children[0].path})
    const childClone2 = Object.assign({}, root2.children[1], {originalPath: root2.children[1].path})
    const clone2 = Object.assign({}, root2, {
        originalPath: root2.path,
        children: [childClone1, childClone2]
    })

    expect(wrapper.state('nodes')).toEqual({
        '/': {depth: 0, key: '0', node: clone2, parent: clone2},
        '/child-1/': {depth: 1, key: '0.0', node: childClone1, parent: clone2},
        '/child-2/': {depth: 1, key: '0.1', node: childClone2, parent: clone2}
    })
})

test('does not revise its node map if other props change', () => {
    const root = {title: 'root', path: '/'}

    const wrapper = mount(<Nav root={root} />)

    const clone = Object.assign({}, root, {originalPath: root.path})
    expect(wrapper.state('nodes')).toEqual({
        '/': {depth: 0, key: '0', node: clone, parent: clone}
    })

    wrapper.setProps({className: 'test'})

    expect(wrapper.state('nodes')).toEqual({
        '/': {depth: 0, key: '0', node: clone, parent: clone}
    })
})

test('.getDerivedState returns the correct direction as action', () => {
    const root = {
        title: 'root',
        path: '/',
        children: [
            {
                title: 'c1',
                path: '/child-1/',
                children: [{title: 'c2', path: '/child-1/child-2/', children: [{}]}]
            }
        ]
    }
    const wrapper = mount(<Nav root={root} path="/child-1/" />)

    expect(
        wrapper.instance().getDerivedState(wrapper.props(), {
            ...wrapper.props(),
            path: '/child-1/child-2/'
        }).action
    ).toBe('descending')

    expect(
        wrapper.instance().getDerivedState(wrapper.props(), {
            ...wrapper.props(),
            path: '/'
        }).action
    ).toBe('ascending')
})

describe('duplicate paths work as expected', () => {
    test('does not throw error for duplicate paths', () => {
        const child1 = {title: 'c', path: '/child/'}
        const child2 = {title: 'c', path: '/child/'}
        const root = {title: 'root', path: '/', children: [child1, child2]}
        const childClone1 = Object.assign({}, child1, {originalPath: child1.path})
        const childClone2 = Object.assign({}, child2, {
            originalPath: child2.path,
            path: `${child2.path}#`
        })
        const clone = Object.assign({}, root, {
            originalPath: root.path,
            children: [childClone1, childClone2]
        })

        const result = Nav.mapTree(root)
        expect(result).toEqual([clone, true])
        expect(Nav.indexTree(clone)).toEqual({
            '/': {node: clone, parent: clone, depth: 0, key: '0'},
            '/child/': {node: childClone1, parent: clone, depth: 1, key: '0.0'},
            '/child/#': {node: childClone2, parent: clone, depth: 1, key: '0.1'}
        })
    })

    test('onPathChange call with duplicate paths', () => {
        const root = {
            title: 'root',
            path: '/',
            children: [{title: 'c1', path: '/child/'}, {title: 'c2', path: '/child/'}]
        }
        jest.useFakeTimers()
        const onPathChange = jest.fn()
        const wrapper = shallow(<Nav root={root} path="/child/#" onPathChange={onPathChange} />)
        const instance = wrapper.instance()
        instance.goToPath('/child/#')
        jest.runAllTimers()
        expect(onPathChange).toHaveBeenCalledTimes(1)
        expect(onPathChange).toHaveBeenLastCalledWith('/child/#', true, 'click', '/child/')
    })

    test('encodePath works as expected', () => {
        const child1 = {title: 'c', path: '/child/'}
        const child2 = {title: 'c', path: '/child/'}
        const root = {title: 'root', path: '/', children: [child1, child2]}
        const map = {
            '/': {node: root, parent: root, depth: 0, key: '0'},
            '/child/': {node: child1, parent: root, depth: 1, key: '0.0'},
            '/child/#': {node: child2, parent: root, depth: 1, key: '0.1'}
        }
        expect(Nav.encodePath('/child/', map)).toEqual('/child/##')
    })
})

test('onPathChange calls are debounced', () => {
    jest.useFakeTimers()

    const child1 = {title: 'child1', path: '/child1/'}
    const child2 = {title: 'child2', path: '/child2/'}
    const root = {title: 'root', path: '/', children: [child1, child2]}

    const onPathChange = jest.fn()

    const wrapper = shallow(<Nav root={root} path="/child1/" onPathChange={onPathChange} />)
    const instance = wrapper.instance()

    instance.goToPath('/child2/', 'mouseEnter')
    instance.goToPath('/child1/', 'mouseLeave')
    instance.goToPath('/child1/', 'blur')
    instance.goToPath('/child2/', 'focus')
    instance.goToPath('/child2/', 'click')

    jest.runAllTimers()

    //Only the last call should be applied
    expect(onPathChange).toHaveBeenCalledTimes(1)
    expect(onPathChange).toBeCalledWith('/child2/', true, 'click', '/child2/')
})

test('Ensure clicks trigger onPathChange', () => {
    jest.useFakeTimers()

    const child1 = {title: 'child1', path: '/child1/'}
    const child2 = {title: 'child2', path: '/child2/'}
    const root = {title: 'root', path: '/', children: [child1, child2]}

    const onPathChange = jest.fn()

    const wrapper = shallow(<Nav root={root} path="/child1/" onPathChange={onPathChange} />)
    const instance = wrapper.instance()

    instance.goToPath('/child2/', 'mouseEnter')
    instance.goToPath('/child2/', 'focus')
    instance.goToPath('/child2/', 'click')
    instance.goToPath('/child2/', 'mouseLeave')
    instance.goToPath('/child2/', 'blur')

    jest.runAllTimers()

    //Click + blur should both be fired
    expect(onPathChange).toHaveBeenCalledTimes(2)
    expect(onPathChange).toBeCalledWith('/child2/', true, 'click', '/child2/')
    expect(onPathChange).toBeCalledWith('/child2/', true, 'blur', '/child2/')
})
