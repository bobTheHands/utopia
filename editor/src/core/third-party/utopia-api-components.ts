import { importAlias, importDetails } from '../shared/project-file-types'
import {
  componentDescriptor,
  DependencyBoundDescriptors,
  ComponentDescriptor,
} from './third-party-types'
import { jsxElement, jsxElementName } from '../shared/element-template'
import { PropertyControls } from 'utopia-api'

function createBasicUtopiaComponent(
  baseVariable: string,
  name: string,
  propertyControls: PropertyControls | null,
): ComponentDescriptor {
  return componentDescriptor(
    {
      'utopia-api': importDetails(null, [importAlias(baseVariable)], null),
    },
    jsxElement(jsxElementName(baseVariable, []), {}, [], null),
    name,
    propertyControls,
  )
}

const StyleObjectProps: PropertyControls = {
  style: {
    type: 'styleobject',
  },
}

export const UtopiaApiComponents: DependencyBoundDescriptors = {
  '>=0.0.0 <1.0.0': {
    name: 'utopia-api',
    components: [
      createBasicUtopiaComponent('Ellipse', 'Ellipse', StyleObjectProps),
      createBasicUtopiaComponent('Layoutable', 'Layoutable', StyleObjectProps),
      createBasicUtopiaComponent('Positionable', 'Positionable', StyleObjectProps),
      createBasicUtopiaComponent('Rectangle', 'Rectangle', StyleObjectProps),
      createBasicUtopiaComponent('Text', 'Text', StyleObjectProps),
      createBasicUtopiaComponent('View', 'View', StyleObjectProps),
    ],
  },
}