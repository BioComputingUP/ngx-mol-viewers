# @biocomputingup/ngx-features-viewer

## 0.0.30

### Patch Changes

- Mistakenly published package with missing changes on 0.0.29

## 0.0.29

### Patch Changes

## Feature Viewer

- Unify rendering pipeline to avoid discrepancies between initial rendering and updated rendering
- Reduce bloated draw service by creating the `gridRenderer` `SequenceRenderer` and update the `TooltipService`
- create test to ensure rendered content is consistently the same even after going through update cycles

## 0.0.28

### Patch Changes

- Update build with locus boundary compute fixed

## 0.0.27

### Patch Changes

- Feature viewer bug fixes and prevent locus oclusion with chain selection

## 0.0.26

### Patch Changes

- Reactivity refactor fixing snapping labels

  - refactor(feature-viewer): reduce amount of lifecycle hooks streamlining the update pipeline in the component
  - refactor: enforce lock-step rendering fixing two-step render lag
  - refactor: pipeline refactoring and cleaning main component deferring logic to the draw and zoom Service
  - fix: organize the codebase and reduce potential race condition
