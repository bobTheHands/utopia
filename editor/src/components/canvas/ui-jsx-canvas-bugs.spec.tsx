import { testCanvasRender } from './ui-jsx-canvas.test-utils'

describe('UiJsxCanvas', () => {
  it('#747 - DOM object constructor cannot be called as a function', () => {
    testCanvasRender(
      null,
      `
/** @jsx jsx */
import * as React from 'react'
import { Scene, Storyboard, jsx } from 'utopia-api'

const DefaultComments = [
  {
    userName: 'forbidden_one',
    contents: 'Integer eu imperdiet enim. Aenean vitae sem et ex feugiat accumsan et a mi.',
  },
]

const Comment = () => <div>hat</div>

export var App = () =>
  true ? DefaultComments.map((comment) => <Comment comment={comment} />) : null

export var storyboard = (
  <Storyboard layout={{ layoutSystem: 'pinSystem' }}>
    <Scene
      component={App}
      style={{ position: 'absolute', left: 0, top: 0, width: 375, height: 812 }}
    />
  </Storyboard>
)
    `,
    )
  })
})