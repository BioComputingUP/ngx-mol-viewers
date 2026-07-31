# @biocomputingup/ngx-features-viewer

## 0.0.26

### Patch Changes

- Reactivity refactor fixing snapping labels

  - refactor(feature-viewer): reduce amount of lifecycle hooks streamlining the update pipeline in the component
  - refactor: enforce lock-step rendering fixing two-step render lag
  - refactor: pipeline refactoring and cleaning main component deferring logic to the draw and zoom Service
  - fix: organize the codebase and reduce potential race condition
