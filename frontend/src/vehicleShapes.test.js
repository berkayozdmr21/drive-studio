import {it,expect} from 'vitest';
import {SHAPES} from './vehicleShapes';
import {VEHICLES} from './config';
it('provides a distinct authored body and roof for all nine concepts',()=>{
 const shapes=VEHICLES.filter(v=>v.kind!=='asset').map(v=>SHAPES[v.id]);
 expect(shapes).toHaveLength(9);
 expect(shapes.every(Boolean)).toBe(true);
 expect(new Set(shapes.map(s=>JSON.stringify(s.body))).size).toBe(9);
 expect(new Set(shapes.map(s=>JSON.stringify(s.roof))).size).toBe(9);
});
it('preserves the identifying structural features',()=>{
 expect(SHAPES.coast.roof).toBeNull();expect(SHAPES.nomad.bed).toBe(true);
 expect(SHAPES.terra.spare).toBe(true);expect(SHAPES.atlas.rails).toBe(true);
 expect(SHAPES.trail.face).toBe('rally');expect(SHAPES.volt.face).toBe('bar');
 expect(SHAPES.aero.roof[2][1]).toBeLessThan(SHAPES.terra.roof[2][1]);
});
