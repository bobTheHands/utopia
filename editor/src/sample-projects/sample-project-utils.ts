import { contentsToTree } from '../components/assets'
import {
  DefaultPackageJson,
  openFileTab,
  PersistentModel,
  persistentModelForProjectContents,
} from '../components/editor/store/editor-state'
import {
  getDefaultUIJsFile,
  getSamplePreviewFile,
  getSamplePreviewHTMLFile,
} from '../core/model/new-project-files'
import { codeFile, directory } from '../core/model/project-file-utils'
import { ProjectContents } from '../core/shared/project-file-types'
import { getSampleComponentsFile, getUiBuilderUIJSFile } from './ui-builder-ui-js-file'

export const UI_BUILDER_PROJECT_ID = 'UI-BUILDER'

export function defaultProject(): PersistentModel {
  const projectContents: ProjectContents = {
    '/package.json': codeFile(JSON.stringify(DefaultPackageJson, null, 2), null),
    '/src': directory(),
    '/src/app.js': getDefaultUIJsFile(),
    '/assets': directory(),
    '/public': directory(),
    '/src/index.js': getSamplePreviewFile(),
    '/public/index.html': getSamplePreviewHTMLFile(),
  }

  let persistentModel = persistentModelForProjectContents(contentsToTree(projectContents))
  persistentModel.openFiles = [openFileTab('/src/app.js'), ...persistentModel.openFiles]
  return persistentModel
}

function uiBuilderProject(): PersistentModel {
  const projectContents: ProjectContents = {
    '/package.json': codeFile(JSON.stringify(DefaultPackageJson, null, 2), null),
    '/src': directory(),
    '/src/app.js': getUiBuilderUIJSFile(),
    '/src/components.js': getSampleComponentsFile(),
    '/assets': directory(),
    '/public': directory(),
    '/src/index.js': getSamplePreviewFile(),
    '/public/index.html': getSamplePreviewHTMLFile(),
  }

  let persistentModel = persistentModelForProjectContents(contentsToTree(projectContents))
  persistentModel.openFiles = [
    openFileTab('/src/app.js'),
    openFileTab('/src/components.js'),
    ...persistentModel.openFiles,
  ]

  return persistentModel
}

export interface SampleProject {
  name: string
  model: PersistentModel
}

export function isSampleProject(projectID: string): boolean {
  return sampleProjectForId(projectID) != null
}

export function sampleProjectForId(projectID: string): SampleProject | null {
  switch (projectID) {
    case UI_BUILDER_PROJECT_ID:
      return {
        name: projectID,
        model: uiBuilderProject(),
      }
    default:
      return null
  }
}
