import React from 'react'
import { render, act } from '@testing-library/react'

import * as EP from '../../../../core/shared/element-path'

import { getStoreHook, TestInspectorContextProvider } from '../../common/inspector.test-utils'
import utils from '../../../../utils/utils'
import { CanvasVector } from '../../../../core/shared/math-utils'
import {
  setupReactWhyDidYouRender,
  enableWhyDidYouRenderOnComponent,
} from '../../../../utils/react-memoize.test-utils'
import { ComponentSection } from './component-section'
import { ScenePathForTestUiJsFile } from '../../../../core/model/test-ui-js-file.test-utils'

describe('Component Section', () => {
  enableWhyDidYouRenderOnComponent(ComponentSection)

  it('make sure whyDidYouRender is enabled', () => {
    expect((ComponentSection as any).whyDidYouRender).toBeTruthy()
  })
  xit('doesnt rerender on irrelevant changes', () => {
    const storeHookForTest = getStoreHook(utils.NO_OP)
    storeHookForTest.updateStoreWithImmer((store) => {
      store.patchedEditor.selectedViews = [
        EP.appendNewElementPath(ScenePathForTestUiJsFile, ['aaa', 'mycomponent']),
      ] // TODO add a Component instance to the test file and select that!
      store.patchedEditor.codeResultCache = {
        propertyControlsInfo: {
          '/src/app': {
            MyComponent: {
              text: {
                type: 'string',
                title: 'Title',
                defaultValue: '',
              },
            },
          },
        },
      } as any
    })

    const [getUpdateCount] = setupReactWhyDidYouRender(true)

    const { getByText } = render(
      <TestInspectorContextProvider
        selectedViews={storeHookForTest.api.getState().patchedEditor.selectedViews}
        editorStoreData={storeHookForTest}
      >
        <ComponentSection isScene={false} />
      </TestInspectorContextProvider>,
    )

    // Component 'Test' is picked by the scene selector
    expect(getByText('Component props')).toBeDefined()

    act(() => {
      storeHookForTest.updateStoreWithImmer((store) => {
        // irrelevant state change, we expect zero rerenders
        store.patchedEditor.canvas.roundedCanvasOffset = { x: 30, y: 50 } as CanvasVector
      })
    })

    expect(getUpdateCount()).toEqual(0)
  })
})
