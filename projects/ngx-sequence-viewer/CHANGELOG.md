# @biocomputingup/ngx-sequence-viewer

## 1.0.5

### Patch Changes

- feat(ngx-structure-viewer): add support for filtering structure by chain. Added a chain property to the Source interface. The viewer now uses Molstar’s StructureSelectionFromExpression to automatically filter the loaded structure to the specified chain. Supports toggling between auth_asym_id and label_asym_id depending on user settings.

## 1.0.3

### Patch Changes

- Refactoring reactivity fixing rendering pipeline and label snapping issue on feature viewer

## 1.0.2

### Patch Changes

- Remove label snapping after initial faulty render when traces are modified

## 1.0.1

### Patch Changes

- 435eb00: Update docs, update demo-builder script and setup changesets
