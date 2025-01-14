import {
  registerModule as registerModuleAPI,
  ComponentToRegister,
  ComponentInsertOption,
  PropertyControls,
} from 'utopia-api/core'
import { ProjectContentTreeRoot } from '../../components/assets'
import {
  ComponentDescriptorWithName,
  ComponentInfo,
  PropertyControlsInfo,
} from '../../components/custom-code/code-file'
import { dependenciesFromPackageJson } from '../../components/editor/npm-dependency/npm-dependency'
import { packageJsonFileFromProjectContents } from '../../components/editor/store/editor-state'
import { parseControlDescription } from './property-controls-parser'
import {
  getParseErrorDetails,
  objectKeyParser,
  optionalObjectKeyParser,
  parseArray,
  parseObject,
  ParseResult,
  parseString,
} from '../../utils/value-parser-utils'
import { UtopiaTsWorkers } from '../workers/common/worker-types'
import { getCachedParseResultForUserStrings } from './property-controls-local-parser-bridge'
import {
  applicative2Either,
  applicative3Either,
  bimapEither,
  Either,
  foldEither,
  isLeft,
  mapEither,
  sequenceEither,
} from '../shared/either'
import { setOptionalProp } from '../shared/object-utils'
import { addRegisteredControls, ControlsToCheck } from '../../components/canvas/canvas-globals'
import { getGlobalEvaluatedFileName } from '../shared/code-exec-utils'
import { memoize } from '../shared/memoize'
import fastDeepEqual from 'fast-deep-equal'
import { TimedCacheMap } from '../shared/timed-cache-map'

async function parseInsertOption(
  insertOption: ComponentInsertOption,
  componentName: string,
  moduleName: string,
  workers: UtopiaTsWorkers,
): Promise<Either<string, ComponentInfo>> {
  const allRequiredImports = `import { ${componentName} } from '${moduleName}'; ${
    insertOption.additionalImports ?? ''
  }`

  const parsedParams = await getCachedParseResultForUserStrings(
    workers,
    allRequiredImports,
    insertOption.code,
  )

  return mapEither(({ importsToAdd, elementToInsert }) => {
    return {
      insertMenuLabel: insertOption.label ?? componentName,
      elementToInsert: elementToInsert,
      importsToAdd: importsToAdd,
    }
  }, parsedParams)
}

function variantsForComponentToRegister(
  componentToRegister: ComponentToRegister,
  componentName: string,
): Array<ComponentInsertOption> {
  if (componentToRegister.variants.length > 0) {
    return componentToRegister.variants
  } else {
    // If none provided, fall back to a default insert option
    return [
      {
        label: componentName,
        code: `<${componentName} />`,
      },
    ]
  }
}

async function componentDescriptorForComponentToRegister(
  componentToRegister: ComponentToRegister,
  componentName: string,
  moduleName: string,
  workers: UtopiaTsWorkers,
): Promise<Either<string, ComponentDescriptorWithName>> {
  const insertOptionsToParse = variantsForComponentToRegister(componentToRegister, componentName)

  const parsedInsertOptionPromises = insertOptionsToParse.map((insertOption) =>
    parseInsertOption(insertOption, componentName, moduleName, workers),
  )

  const parsedVariantsUnsequenced = await Promise.all(parsedInsertOptionPromises)
  const parsedVariants = sequenceEither(parsedVariantsUnsequenced)

  return mapEither((variants) => {
    return {
      componentName: componentName,
      properties: componentToRegister.properties,
      variants: variants,
    }
  }, parsedVariants)
}

interface PreparedComponentDescriptorsForRegistering {
  sourceFile: string
  moduleNameOrPath: string
  componentDescriptors: ControlsToCheck
}

function prepareComponentDescriptorsForRegistering(
  workers: UtopiaTsWorkers,
  moduleNameOrPath: string,
  components: { [componentName: string]: ComponentToRegister },
): PreparedComponentDescriptorsForRegistering {
  const componentNames = Object.keys(components)
  const componentDescriptorPromises = componentNames.map((componentName) => {
    const componentToRegister = components[componentName]
    return componentDescriptorForComponentToRegister(
      componentToRegister,
      componentName,
      moduleNameOrPath,
      workers,
    )
  })

  const componentDescriptorsUnsequenced = Promise.all(componentDescriptorPromises)
  const componentDescriptors = componentDescriptorsUnsequenced.then((unsequenced) =>
    sequenceEither(unsequenced),
  )

  return {
    sourceFile: getGlobalEvaluatedFileName(),
    moduleNameOrPath: moduleNameOrPath,
    componentDescriptors: componentDescriptors,
  }
}

function fullyParsePropertyControls(value: unknown): ParseResult<PropertyControls> {
  return parseObject(parseControlDescription)(value)
}

function parseComponentInsertOption(value: unknown): ParseResult<ComponentInsertOption> {
  return applicative3Either(
    (code, additionalImports, label) => {
      let insertOption: ComponentInsertOption = {
        code: code,
      }

      setOptionalProp(insertOption, 'additionalImports', additionalImports)
      setOptionalProp(insertOption, 'label', label)

      return insertOption
    },
    objectKeyParser(parseString, 'code')(value),
    optionalObjectKeyParser(parseString, 'additionalImports')(value),
    optionalObjectKeyParser(parseString, 'label')(value),
  )
}

function parseComponentToRegister(value: unknown): ParseResult<ComponentToRegister> {
  return applicative2Either(
    (properties, variants) => {
      return {
        properties: properties,
        variants: variants,
      }
    },
    objectKeyParser(fullyParsePropertyControls, 'properties')(value),
    objectKeyParser(parseArray(parseComponentInsertOption), 'variants')(value),
  )
}

const parseComponents: (
  value: unknown,
) => ParseResult<{ [componentName: string]: ComponentToRegister }> = parseObject(
  parseComponentToRegister,
)

function parseAndPrepareComponents(
  workers: UtopiaTsWorkers,
  moduleNameOrPath: string,
  unparsedComponents: unknown,
): Either<string, PreparedComponentDescriptorsForRegistering> {
  const parsedComponents = parseComponents(unparsedComponents)

  return bimapEither(
    (parseError) => {
      const errorDetails = getParseErrorDetails(parseError)
      return `registerModule second param (components): ${errorDetails.description} [${errorDetails.path}]`
    },
    (components: { [componentName: string]: ComponentToRegister }) => {
      return prepareComponentDescriptorsForRegistering(workers, moduleNameOrPath, components)
    },
    parsedComponents,
  )
}

type PartiallyAppliedParseAndPrepareComponents = (
  unparsedComponents: unknown,
) => Either<string, PreparedComponentDescriptorsForRegistering>

const partiallyParseAndPrepareComponents = (
  workers: UtopiaTsWorkers,
  moduleNameOrPath: string,
): PartiallyAppliedParseAndPrepareComponents => {
  return (unparsedComponents: unknown) =>
    parseAndPrepareComponents(workers, moduleNameOrPath, unparsedComponents)
}

export function createRegisterModuleFunction(
  workers: UtopiaTsWorkers | null,
): typeof registerModuleAPI {
  let cachedParseAndPrepareComponentsMap = new TimedCacheMap<
    string,
    PartiallyAppliedParseAndPrepareComponents
  >()

  // create a function with a signature that matches utopia-api/registerModule
  return function registerModule(
    unparsedModuleName: string,
    unparsedComponents: { [componentName: string]: ComponentToRegister },
  ): void {
    const parsedModuleName = parseString(unparsedModuleName)

    foldEither(
      (parseFailure) => {
        const errorDetails = getParseErrorDetails(parseFailure)
        throw new Error(`registerModule first param (moduleName): ${errorDetails.description}`)
      },
      (moduleName) => {
        if (workers != null) {
          let parseAndPrepareComponentsFn = cachedParseAndPrepareComponentsMap.get(moduleName)
          if (parseAndPrepareComponentsFn == null) {
            // Create a memoized function for the handling of component descriptors for the specified module name
            parseAndPrepareComponentsFn = memoize(
              partiallyParseAndPrepareComponents(workers, moduleName),
              {
                equals: fastDeepEqual,
                maxSize: 5,
              },
            )
            cachedParseAndPrepareComponentsMap.set(moduleName, parseAndPrepareComponentsFn)
          }

          const parsedPreparedDescriptors = parseAndPrepareComponentsFn(unparsedComponents)
          foldEither(
            (parseFailureErrorMessage) => {
              throw new Error(parseFailureErrorMessage)
            },
            (preparedDescriptors) => {
              // Fires off asynchronously.
              addRegisteredControls(
                preparedDescriptors.sourceFile,
                preparedDescriptors.moduleNameOrPath,
                preparedDescriptors.componentDescriptors,
              )
            },
            parsedPreparedDescriptors,
          )
        }
      },
      parsedModuleName,
    )
  }
}

export function getThirdPartyControlsIntrinsic(
  elementName: string,
  propertyControlsInfo: PropertyControlsInfo,
  projectContents: ProjectContentTreeRoot,
): PropertyControls | null {
  const packageJsonFile = packageJsonFileFromProjectContents(projectContents)
  const dependencies = dependenciesFromPackageJson(packageJsonFile, 'combined')
  const foundPackageWithElement = Object.keys(propertyControlsInfo).find((key) => {
    return (
      propertyControlsInfo[key][elementName] != null &&
      dependencies.some((dependency) => dependency.name === key)
    )
  })
  if (foundPackageWithElement != null) {
    return propertyControlsInfo[foundPackageWithElement]?.[elementName]?.properties
  }
  return null
}
