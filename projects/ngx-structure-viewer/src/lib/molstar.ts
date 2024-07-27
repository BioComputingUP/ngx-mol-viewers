import { Structure, StructureElement, StructureSelection } from 'molstar/lib/mol-model/structure';
import { Loci } from 'molstar/lib/mol-model/structure/structure/element/loci';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { MolScriptBuilder } from "molstar/lib/mol-script/language/builder";
import { Expression } from 'molstar/lib/mol-script/language/expression';
import { Overpaint } from 'molstar/lib/mol-theme/overpaint';
import { Script } from 'molstar/lib/mol-script/script';
import { Color } from 'molstar/lib/mol-util/color';

export { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
export { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
export { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18';
export { PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
export { createPluginUI } from 'molstar/lib/mol-plugin-ui';
export { Asset } from 'molstar/lib/mol-util/assets';

export const OverpaintStructureRepresentation3DFromBundle = StateTransforms.Representation.OverpaintStructureRepresentation3DFromBundle;

export const TransparencyStructureRepresentation3DFromBundle = StateTransforms.Representation.TransparencyStructureRepresentation3DFromBundle;

export const overpaintToBundle = Overpaint.toBundle;

export type BundleLayer = Overpaint.BundleLayer & { alpha: number };

export function colorFromHexString(hex: string): [Color, number] {
  // Declare hue string
  let hue: string;
  // Remove starting hashtag
  hex = hex.replace(/^#/, '');
  // Split string in hex, alpha
  [hue, hex] = [hex.slice(6, 8), hex.slice(0, 6)];
  // Define color
  const color = Color.fromHexStyle('#' + hex);
  // Define alpha component
  const alpha = Number('0x' + (hue || 'ff')) / 255;
  // Define color, alpha
  return [color, 1.0 - alpha];
}

export function getBundleFromLoci(loci: Loci) {
  // Just return bundle from loci
  return StructureElement.Bundle.fromLoci(loci);
}

export function getLocusFromQuery(query: Expression, structure: Structure): StructureElement.Loci {
  // Execute query, retrieve selection
  const selection: StructureSelection = Script.getStructureSelection(query, structure);
  // Cast selection to loci
  return StructureSelection.toLociWithSourceUnits(selection);
}

export function getLocusFromSet(set: string[], structure: Structure): StructureElement.Loci {
  // Override query
  const query = MolScriptBuilder.struct.generator.atomGroups({
    // Select atoms between <begin> and <end> atom IDs
    'residue-test': MolScriptBuilder.core.set.has([
      // Define subset of resdiue identifiers
      MolScriptBuilder.set(...set),
      // Define set of residue identifiers (author sequence identifiers)
      MolScriptBuilder.core.str.concat([
        MolScriptBuilder.ammp('auth_asym_id'),
        MolScriptBuilder.ammp('auth_seq_id'),
        MolScriptBuilder.ammp('pdbx_PDB_ins_code'),
      ]),
    ]),
  });
  // Create loci
  return getLocusFromQuery(query, structure);
}

// Filter overpaint layers for given structure
export function getFilteredBundle(layers: Overpaint.BundleLayer[], structure: Structure) {
  // Generate overpaint out of bundle
  const overpaint: Overpaint = Overpaint.ofBundle(layers, structure.root);
  // Merge overpaint layers together (order matters)
  const merged: Overpaint = Overpaint.merge(overpaint);
  // Apply overpaint on target structure
  return Overpaint.filter(merged, structure);
}
