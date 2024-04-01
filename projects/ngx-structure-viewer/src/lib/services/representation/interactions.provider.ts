import { addFixedCountDashedCylinder } from 'molstar/lib/mol-geo/geometry/mesh/builder/cylinder';
import { MeshBuilder } from 'molstar/lib/mol-geo/geometry/mesh/mesh-builder';
import { PluginStateObject } from 'molstar/lib/mol-plugin-state/objects';
import { ParamDefinition } from 'molstar/lib/mol-util/param-definition';
import { StateTransformer } from 'molstar/lib/mol-state/transformer';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra/3d/vec3';
import { Mesh } from 'molstar/lib/mol-geo/geometry/mesh/mesh';
import { Shape } from 'molstar/lib/mol-model/shape/shape';
import { Color } from 'molstar/lib/mol-util/color';

// Define function for creating a mesh
function createMesh(cylinders: { from: Vec3, to: Vec3, color: Color, label: string, size: number }[]) {
  // Initialize mesh state (then, manipulate it)
  const builder = MeshBuilder.createState(512, 512);
  // For loop iterating over each input cylinder
  for (let i = 0; i < cylinders.length; i++) {
    // Get current cylinder
    const cylinder = cylinders[i];
    // Update current group (add new group for each cylinder)
    builder.currentGroup = i;
    // The number of segment is determined by the distance between the two points
    const distance = Vec3.distance(cylinder.from, cylinder.to);
    const segments = Math.floor(distance / 0.33); // TODO
    // This creates a dashed cylinder
    addFixedCountDashedCylinder(builder, cylinder.from, cylinder.to, 1, segments, true, {
      radialSegments : 8,
      radiusTop : cylinder.size,
      radiusBottom : cylinder.size,
      topCap : true,
      bottomCap : true,
    });
  }
  // Create shape
  return Shape.create(
    '',
    cylinders,
    MeshBuilder.getMesh(builder),
    (g) => cylinders[g].color, // color of group
    () => 1,
    (g) => cylinders[g].label,
  );
}

// const Transform = StateTransformer.builderFactory('my-namespace');
const Transform = StateTransformer.builderFactory('interactions');

export const CreateMeshProvider = Transform({
  name : 'interactions',
  from : PluginStateObject.Root,
  to : PluginStateObject.Shape.Provider,
  params : {
    data : ParamDefinition.Value<unknown>(undefined, {isHidden : false}),
  },
})({
  apply({ params }) {
    return new PluginStateObject.Shape.Provider({
      label : '',
      data : params.data,
      params : Mesh.Params,
      geometryUtils : Mesh.Utils,
      getShape : (_, data) => createMesh(data),
    }, {label : ''});
  },
});