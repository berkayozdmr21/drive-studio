import {it,expect} from 'vitest';
import {exportDimensions} from './render';
it('exports 4K width preserving camera aspect',()=>expect(exportDimensions(3840,16/9,8192)).toEqual({width:3840,height:2160}));
it('preserves portrait framing',()=>expect(exportDimensions(1920,.75,8192)).toEqual({width:1920,height:2560}));
it('rejects width above GPU limit',()=>expect(()=>exportDimensions(3840,2,2048)).toThrow());
it('rejects height above GPU limit',()=>expect(()=>exportDimensions(3840,.5,4096)).toThrow());
it('rejects invalid camera aspect',()=>expect(()=>exportDimensions(1920,0,8192)).toThrow());
