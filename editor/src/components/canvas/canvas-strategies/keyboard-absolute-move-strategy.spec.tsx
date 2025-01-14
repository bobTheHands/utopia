import { elementPath } from '../../../core/shared/element-path'
import {
  ElementInstanceMetadata,
  SpecialSizeMeasurements,
} from '../../../core/shared/element-template'
import { canvasPoint, canvasRectangle } from '../../../core/shared/math-utils'
import { ElementPath } from '../../../core/shared/project-file-types'
import { KeyCharacter } from '../../../utils/keyboard'
import { emptyModifiers } from '../../../utils/modifiers'
import { EditorState } from '../../editor/store/editor-state'
import { foldAndApplyCommands } from '../commands/commands'
import {
  getEditorState,
  makeTestProjectCodeWithSnippet,
  testPrintCodeFromEditorState,
} from '../ui-jsx.test-utils'
import { pickCanvasStateFromEditorState } from './canvas-strategies'
import {
  createInteractionViaKeyboard,
  InteractionSession,
  StrategyState,
} from './interaction-state'
import { keyboardAbsoluteMoveStrategy } from './keyboard-absolute-move-strategy'

function prepareEditorState(codeSnippet: string, selectedViews: Array<ElementPath>): EditorState {
  return {
    ...getEditorState(makeTestProjectCodeWithSnippet(codeSnippet)),
    selectedViews: selectedViews,
  }
}

function pressKeys(editorState: EditorState, keys: Array<KeyCharacter>): EditorState {
  const interactionSession: InteractionSession = {
    ...createInteractionViaKeyboard(
      keys,
      emptyModifiers,
      null as any, // the strategy does not use this
    ),
    metadata: null as any, // the strategy does not use this
  }

  const strategyResult = keyboardAbsoluteMoveStrategy.apply(
    pickCanvasStateFromEditorState(editorState),
    interactionSession,
    {
      currentStrategy: null as any, // the strategy does not use this
      currentStrategyFitness: null as any, // the strategy does not use this
      currentStrategyCommands: null as any, // the strategy does not use this
      accumulatedPatches: null as any, // the strategy does not use this
      commandDescriptions: null as any, // the strategy does not use this
      sortedApplicableStrategies: null as any, // the strategy does not use this
      startingMetadata: {
        'scene-aaa/app-entity:aaa/bbb': {
          elementPath: elementPath([
            ['scene-aaa', 'app-entity'],
            ['aaa', 'bbb'],
          ]),
          specialSizeMeasurements: {
            immediateParentBounds: canvasRectangle({ x: 0, y: 0, width: 400, height: 400 }),
          } as SpecialSizeMeasurements,
        } as ElementInstanceMetadata,
      },
    } as StrategyState,
  )

  const finalEditor = foldAndApplyCommands(
    editorState,
    editorState,
    [],
    [],
    strategyResult,
    'permanent',
  ).editorState

  return finalEditor
}

function pressLeft(editorState: EditorState): EditorState {
  return pressKeys(editorState, ['left'])
}

describe('Keyboard Absolute Move Strategy', () => {
  it('works with a TL pinned absolute element', async () => {
    const targetElement = elementPath([
      ['scene-aaa', 'app-entity'],
      ['aaa', 'bbb'],
    ])

    const initialEditor: EditorState = prepareEditorState(
      `
    <View style={{ ...(props.style || {}) }} data-uid='aaa'>
      <View
        style={{ backgroundColor: '#0091FFAA', position: 'absolute', left: 50, top: 50, width: 250, height: 300 }}
        data-uid='bbb'
      />
    </View>
    `,
      [targetElement],
    )

    const finalEditor = pressLeft(initialEditor)

    expect(testPrintCodeFromEditorState(finalEditor)).toEqual(
      makeTestProjectCodeWithSnippet(
        `<View style={{ ...(props.style || {}) }} data-uid='aaa'>
        <View
          style={{ backgroundColor: '#0091FFAA', position: 'absolute', left: 49, top: 50, width: 250, height: 300 }}
          data-uid='bbb'
        />
      </View>`,
      ),
    )
  })

  it('works with left and top pressed simultaneously', async () => {
    const targetElement = elementPath([
      ['scene-aaa', 'app-entity'],
      ['aaa', 'bbb'],
    ])

    const initialEditor: EditorState = prepareEditorState(
      `
    <View style={{ ...(props.style || {}) }} data-uid='aaa'>
      <View
        style={{ backgroundColor: '#0091FFAA', position: 'absolute', left: 50, top: 50, width: 250, height: 300 }}
        data-uid='bbb'
      />
    </View>
    `,
      [targetElement],
    )

    const finalEditor = pressKeys(initialEditor, ['left', 'up'])

    expect(testPrintCodeFromEditorState(finalEditor)).toEqual(
      makeTestProjectCodeWithSnippet(
        `<View style={{ ...(props.style || {}) }} data-uid='aaa'>
        <View
          style={{ backgroundColor: '#0091FFAA', position: 'absolute', left: 49, top: 49, width: 250, height: 300 }}
          data-uid='bbb'
        />
      </View>`,
      ),
    )
  })

  it('works with a TL pinned absolute element with px values', async () => {
    const targetElement = elementPath([
      ['scene-aaa', 'app-entity'],
      ['aaa', 'bbb'],
    ])

    const initialEditor: EditorState = prepareEditorState(
      `
    <View style={{ ...(props.style || {}) }} data-uid='aaa'>
      <View
        style={{ backgroundColor: '#0091FFAA', position: 'absolute', left: '50px', top: 50, width: 250, height: 300 }}
        data-uid='bbb'
      />
    </View>
    `,
      [targetElement],
    )

    const finalEditor = pressLeft(initialEditor)

    expect(testPrintCodeFromEditorState(finalEditor)).toEqual(
      makeTestProjectCodeWithSnippet(
        `<View style={{ ...(props.style || {}) }} data-uid='aaa'>
        <View
          style={{ backgroundColor: '#0091FFAA', position: 'absolute', left: '49px', top: 50, width: 250, height: 300 }}
          data-uid='bbb'
        />
      </View>`,
      ),
    )
  })

  it('works with a RB pinned absolute element', async () => {
    const targetElement = elementPath([
      ['scene-aaa', 'app-entity'],
      ['aaa', 'bbb'],
    ])

    const initialEditor: EditorState = prepareEditorState(
      `
    <View style={{ ...(props.style || {}) }} data-uid='aaa'>
      <View
        style={{ backgroundColor: '#0091FFAA', position: 'absolute', right: 50, bottom: 50, width: 250, height: 300 }}
        data-uid='bbb'
      />
    </View>
    `,
      [targetElement],
    )

    const finalEditor = pressLeft(initialEditor)

    expect(testPrintCodeFromEditorState(finalEditor)).toEqual(
      makeTestProjectCodeWithSnippet(
        `<View style={{ ...(props.style || {}) }} data-uid='aaa'>
        <View
          style={{ backgroundColor: '#0091FFAA', position: 'absolute', right: 51, bottom: 50, width: 250, height: 300 }}
          data-uid='bbb'
        />
      </View>`,
      ),
    )
  })

  it('works with a TLRB pinned absolute element', async () => {
    const targetElement = elementPath([
      ['scene-aaa', 'app-entity'],
      ['aaa', 'bbb'],
    ])

    const initialEditor: EditorState = prepareEditorState(
      `
    <View style={{ ...(props.style || {}) }} data-uid='aaa'>
      <View
        style={{ backgroundColor: '#0091FFAA', position: 'absolute', left: 50, top: 50, right: 50, bottom: 50, width: 250, height: 300 }}
        data-uid='bbb'
      />
    </View>
    `,
      [targetElement],
    )

    const finalEditor = pressLeft(initialEditor)

    expect(testPrintCodeFromEditorState(finalEditor)).toEqual(
      makeTestProjectCodeWithSnippet(
        `<View style={{ ...(props.style || {}) }} data-uid='aaa'>
        <View
          style={{ backgroundColor: '#0091FFAA', position: 'absolute', left: 49, top: 50, right: 51, bottom: 50, width: 250, height: 300 }}
          data-uid='bbb'
        />
      </View>`,
      ),
    )
  })

  // TODO needs design review
  it('keeps expressions intact', async () => {
    const targetElement = elementPath([
      ['scene-aaa', 'app-entity'],
      ['aaa', 'bbb'],
    ])

    const initialEditor: EditorState = prepareEditorState(
      `
    <View style={{ ...(props.style || {}) }} data-uid='aaa'>
      <View
        style={{ backgroundColor: '#0091FFAA', position: 'absolute', left: 50 + 5, top: 50 + props.top, width: 250, height: 300 }}
        data-uid='bbb'
      />
    </View>
    `,
      [targetElement],
    )

    const finalEditor = pressLeft(initialEditor)

    expect(testPrintCodeFromEditorState(finalEditor)).toEqual(
      testPrintCodeFromEditorState(initialEditor),
    )
  })

  it('works with percentages', async () => {
    const targetElement = elementPath([
      ['scene-aaa', 'app-entity'],
      ['aaa', 'bbb'],
    ])

    const initialEditor: EditorState = prepareEditorState(
      `
    <View style={{ ...(props.style || {}) }} data-uid='aaa'>
      <View
        style={{ backgroundColor: '#0091FFAA', position: 'absolute', left: '25%', top: '0%', width: 250, height: 300 }}
        data-uid='bbb'
      />
    </View>
    `,
      [targetElement],
    )

    const finalEditor = pressLeft(initialEditor)

    expect(testPrintCodeFromEditorState(finalEditor)).not.toEqual(
      expect(testPrintCodeFromEditorState(finalEditor)).toEqual(
        makeTestProjectCodeWithSnippet(
          `<View style={{ ...(props.style || {}) }} data-uid='aaa'>
        <View
          style={{ backgroundColor: '#0091FFAA', position: 'absolute', left: '24.75%', top: '0%', width: 250, height: 300 }}
          data-uid='bbb'
        />
      </View>`,
        ),
      ),
    )
  })
})
