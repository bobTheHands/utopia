import {
  NumberControlDescription,
  EnumControlDescription,
  BooleanControlDescription,
  StringControlDescription,
  PopUpListControlDescription,
  OptionsControlDescription,
  ColorControlDescription,
  IgnoreControlDescription,
  ImageControlDescription,
  StyleObjectControlDescription,
  FolderControlDescription,
  RawJSControlDescription,
} from 'utopia-api'
import {
  parseNumberControlDescription,
  parseEnumControlDescription,
  parseBooleanControlDescription,
  parseStringControlDescription,
  parsePopUpListControlDescription,
  parseOptionsControlDescription,
  parseColorControlDescription,
  ParsedPropertyControls,
  parsePropertyControls,
  parseIgnoreControlDescription,
  parseImageControlDescription,
  parseStyleObjectControlDescription,
  parseFolderControlDescription,
  parseControlDescription,
  parseRawJSControlDescription,
} from './property-controls-parser'
import { right, left, isLeft } from '../shared/either'
import {
  objectFieldParseError,
  descriptionParseError,
  arrayIndexParseError,
  ParseResult,
  ParseError,
} from '../../utils/value-parser-utils'
import { pick } from '../shared/object-utils'
import { fastForEach } from '../shared/utils'

function runBaseTestSuite<T>(
  validObject: T,
  requiredFields: Array<keyof T>,
  invalidDefaults: unknown[],
  defaultAllowed: boolean,
  parseFn: (value: unknown) => ParseResult<T>,
) {
  it('parses a full value correctly', () => {
    expect(parseFn(validObject)).toEqual(right(validObject))
  })
  it('parses a minimal value correctly', () => {
    const value = pick(requiredFields, validObject)
    expect(parseFn(value)).toEqual(right(value))
  })
  it('fails on an invalid title', () => {
    const value = {
      ...validObject,
      title: true,
    }
    expect(parseFn(value)).toEqual(
      left(objectFieldParseError('title', descriptionParseError('Not a string.'))),
    )
  })
  it('fails on an invalid type', () => {
    const value = {
      ...validObject,
      type: 'ham sandwich',
    }
    expect(parseFn(value)).toEqual(
      left(objectFieldParseError('type', descriptionParseError('Not a member of an enum.'))),
    )
  })

  if (defaultAllowed) {
    it('fails on an invalid default', () => {
      fastForEach(invalidDefaults, (invalidDefault) => {
        const value = {
          ...validObject,
          defaultValue: invalidDefault,
        }
        expect(isLeft(parseFn(value))).toBeTruthy()
      })
    })
  } else {
    it('ignores a default value', () => {
      const value = {
        ...validObject,
        defaultValue: 'anything really',
      }

      expect(parseFn(value)).toEqual(right(validObject))
    })
  }
}

const validBooleanControlDescriptionValue: BooleanControlDescription = {
  title: 'Boolean Control',
  type: 'boolean',
  defaultValue: true,
  disabledTitle: 'Not set.',
  enabledTitle: 'Value is set',
}

describe('parseBooleanControlDescription', () => {
  runBaseTestSuite(
    validBooleanControlDescriptionValue,
    ['type'],
    ['hat'],
    true,
    parseBooleanControlDescription,
  )
})

const validColorControlDescriptionValue: ColorControlDescription = {
  title: 'Slider Control',
  type: 'color',
  defaultValue: '#FFFFFF',
}

describe('parseColorControlDescription', () => {
  runBaseTestSuite(
    validColorControlDescriptionValue,
    ['type'],
    ['hat', 9],
    true,
    parseColorControlDescription,
  )
})

const validRawJSControlDescriptionValue: RawJSControlDescription = {
  title: 'Raw JS Control',
  type: 'rawjs',
}

describe('parseRawJSControlDescription', () => {
  runBaseTestSuite(
    validRawJSControlDescriptionValue,
    ['type'],
    [],
    false,
    parseRawJSControlDescription,
  )
})

const validEnumControlDescriptionValue: EnumControlDescription = {
  title: 'Enum Control',
  type: 'enum',
  defaultValue: 5,
  options: ['hat', 5, true, undefined, null],
  optionTitles: ['first title', 'second title'],
  displaySegmentedControl: true,
}

describe('parseEnumControlDescription', () => {
  runBaseTestSuite(
    validEnumControlDescriptionValue,
    ['type', 'options'],
    [['hat']],
    true,
    parseEnumControlDescription,
  )
})

const validIgnoreControlDescriptionValue: IgnoreControlDescription = {
  title: 'Ignore Description',
  type: 'ignore',
}

describe('parseIgnoreControlDescription', () => {
  runBaseTestSuite(
    validIgnoreControlDescriptionValue,
    ['type'],
    [],
    false,
    parseIgnoreControlDescription,
  )
})

const validImageControlDescriptionValue: ImageControlDescription = {
  title: 'Image Control',
  type: 'image',
  defaultValue: 'www.somewebsite.com/iamanimage.jpg',
}

describe('parseImageControlDescription', () => {
  runBaseTestSuite(
    validImageControlDescriptionValue,
    ['type'],
    [0],
    true,
    parseImageControlDescription,
  )
})

const validNumberControlDescriptionValue: NumberControlDescription = {
  title: 'Number Title',
  type: 'number',
  defaultValue: 5,
  max: 10,
  min: 2,
  unit: 'Some Unit',
  step: 1,
  displayStepper: true,
}

describe('parseNumberControlDescription', () => {
  runBaseTestSuite(
    validNumberControlDescriptionValue,
    ['type'],
    ['hat'],
    true,
    parseNumberControlDescription,
  )
})

const validOptionsControlDescriptionValue: OptionsControlDescription = {
  title: 'Pop Up List Control',
  type: 'options',
  defaultValue: 5,
  options: [
    { value: 5, label: 'Five' },
    { value: 8, label: 'Eight' },
  ],
}

describe('parseOptionsControlDescription', () => {
  runBaseTestSuite(
    validOptionsControlDescriptionValue,
    ['type', 'options'],
    [],
    true,
    parseOptionsControlDescription,
  )

  it('fails on an invalid option', () => {
    const value = {
      ...validOptionsControlDescriptionValue,
      options: ['error'],
    }
    expect(parseOptionsControlDescription(value)).toEqual(
      left(
        objectFieldParseError(
          'options',
          arrayIndexParseError(0, descriptionParseError('Not an object.')),
        ),
      ),
    )
  })
})

const validPopUpListControlDescriptionValue: PopUpListControlDescription = {
  title: 'Pop Up List Control',
  type: 'popuplist',
  defaultValue: 5,
  options: [
    { value: 5, label: 'Five' },
    { value: 8, label: 'Eight' },
  ],
}

describe('parsePopUpListControlDescription', () => {
  runBaseTestSuite(
    validPopUpListControlDescriptionValue,
    ['type', 'options'],
    [],
    true,
    parsePopUpListControlDescription,
  )

  it('fails on an invalid option', () => {
    const value = {
      ...validPopUpListControlDescriptionValue,
      options: ['error'],
    }
    expect(parsePopUpListControlDescription(value)).toEqual(
      left(
        objectFieldParseError(
          'options',
          arrayIndexParseError(0, descriptionParseError('Not an object.')),
        ),
      ),
    )
  })
})

const validStringControlDescriptionValue: StringControlDescription = {
  title: 'String Control',
  type: 'string',
  defaultValue: 'Some text',
  placeholder: 'Enter text',
  obscured: true,
}

describe('parseStringControlDescription', () => {
  runBaseTestSuite(
    validStringControlDescriptionValue,
    ['type'],
    [9],
    true,
    parseStringControlDescription,
  )
})

const validStyleObjectControlDescriptionValue: StyleObjectControlDescription = {
  title: 'Style Object Control',
  type: 'styleobject',
  defaultValue: { width: 100 },
  placeholder: { height: 100 },
}

describe('parseStyleObjectControlDescription', () => {
  runBaseTestSuite(
    validStyleObjectControlDescriptionValue,
    ['type'],
    ['hat', 9],
    true,
    parseStyleObjectControlDescription,
  )
})

const validFolderControlDescriptionValue: FolderControlDescription = {
  type: 'folder',
  controls: {
    style: validStyleObjectControlDescriptionValue,
    someSlider: validNumberControlDescriptionValue,
  },
}

describe('parseControlDescription', () => {
  it('parses a number description correctly', () => {
    expect(
      parseControlDescription(
        validNumberControlDescriptionValue,
        'testPropName',
        'includeSpecialProps',
      ),
    ).toEqual(right(validNumberControlDescriptionValue))
  })
  it('parses an enum description correctly', () => {
    expect(
      parseControlDescription(
        validEnumControlDescriptionValue,
        'testPropName',
        'includeSpecialProps',
      ),
    ).toEqual(right(validEnumControlDescriptionValue))
  })
  it('parses a boolean description correctly', () => {
    expect(
      parseControlDescription(
        validBooleanControlDescriptionValue,
        'testPropName',
        'includeSpecialProps',
      ),
    ).toEqual(right(validBooleanControlDescriptionValue))
  })
  it('parses a string description correctly', () => {
    expect(
      parseControlDescription(
        validStringControlDescriptionValue,
        'testPropName',
        'includeSpecialProps',
      ),
    ).toEqual(right(validStringControlDescriptionValue))
  })
  it('parses a popup list description correctly', () => {
    expect(
      parseControlDescription(
        validPopUpListControlDescriptionValue,
        'testPropName',
        'includeSpecialProps',
      ),
    ).toEqual(right(validPopUpListControlDescriptionValue))
  })
  it('parses a options list description correctly', () => {
    expect(
      parseControlDescription(
        validOptionsControlDescriptionValue,
        'testPropName',
        'includeSpecialProps',
      ),
    ).toEqual(right(validOptionsControlDescriptionValue))
  })
  it('parses a color description correctly', () => {
    expect(
      parseControlDescription(
        validColorControlDescriptionValue,
        'testPropName',
        'includeSpecialProps',
      ),
    ).toEqual(right(validColorControlDescriptionValue))
  })
  it('parses a raw js control description correctly', () => {
    expect(
      parseControlDescription(
        validRawJSControlDescriptionValue,
        'testPropName',
        'includeSpecialProps',
      ),
    ).toEqual(right(validRawJSControlDescriptionValue))
  })
  it('parses an ignore description correctly', () => {
    expect(
      parseControlDescription(
        validIgnoreControlDescriptionValue,
        'testPropName',
        'includeSpecialProps',
      ),
    ).toEqual(right(validIgnoreControlDescriptionValue))
  })
  it('parses a folder instance description correctly', () => {
    expect(
      parseControlDescription(
        validFolderControlDescriptionValue,
        'testPropName',
        'includeSpecialProps',
      ),
    ).toEqual(right(validFolderControlDescriptionValue))
  })
  it('fails on a value that is not an object', () => {
    expect(parseControlDescription('hat', 'testPropName', 'includeSpecialProps')).toEqual(
      left(descriptionParseError('Not an object.')),
    )
  })
  it('fails on a value that is an invalid case of one of the descriptions', () => {
    const value = {
      ...validOptionsControlDescriptionValue,
      title: true,
    }
    expect(parseControlDescription(value, 'testPropName', 'includeSpecialProps')).toEqual(
      left(objectFieldParseError('title', descriptionParseError('Not a string.'))),
    )
  })
})

describe('parsePropertyControls', () => {
  it('returns the property controls fully parsed when they are all valid', () => {
    const propertyControlsValue = {
      width: validNumberControlDescriptionValue,
      height: validNumberControlDescriptionValue,
    }
    const expectedResult: ParseResult<ParsedPropertyControls> = right({
      width: right(validNumberControlDescriptionValue),
      height: right(validNumberControlDescriptionValue),
    })
    expect(parsePropertyControls(propertyControlsValue, 'includeSpecialProps')).toEqual(
      expectedResult,
    )
  })
  it('returns the property controls fully parsed when some are invalid', () => {
    const propertyControlsValue = {
      width: validNumberControlDescriptionValue,
      height: {
        ...validNumberControlDescriptionValue,
        defaultValue: 'hat',
      },
    }
    const expectedResult: ParseResult<ParsedPropertyControls> = right({
      width: right(validNumberControlDescriptionValue),
      height: left(objectFieldParseError('defaultValue', descriptionParseError('Not a number.'))),
    })
    expect(parsePropertyControls(propertyControlsValue, 'includeSpecialProps')).toEqual(
      expectedResult,
    )
  })
  it('gives an error if the entire value is invalid', () => {
    const propertyControlsValue = 5
    const expectedResult: ParseResult<ParsedPropertyControls> = left(
      descriptionParseError('Not an object.'),
    )
    expect(parsePropertyControls(propertyControlsValue, 'includeSpecialProps')).toEqual(
      expectedResult,
    )
  })
})
