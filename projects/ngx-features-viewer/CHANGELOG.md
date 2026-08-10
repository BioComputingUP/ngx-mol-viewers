# @biocomputingup/ngx-features-viewer

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
