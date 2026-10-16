import {describe,it,expect,vi,afterEach} from 'vitest';
import {DEFAULT_CONFIG,CATALOG,VEHICLES,getVehicle,estimate,validConfig,api} from './config';
afterEach(()=>vi.unstubAllGlobals());
describe('configuration and API contract',()=>{
 it('has ten independently identified vehicles',()=>{expect(VEHICLES).toHaveLength(10);expect(new Set(VEHICLES.map(v=>v.id)).size).toBe(10);});
 it('prices every vehicle independently',()=>{for(const vehicle of VEHICLES)expect(estimate({...DEFAULT_CONFIG,vehicle:vehicle.id})).toBe(vehicle.base_price+5400);});
 it('rejects unknown vehicles in imports',()=>expect(validConfig({...DEFAULT_CONFIG,vehicle:'fake'})).toBeNull());
 it('migrates old drafts to the original model',()=>{const {vehicle,...old}=DEFAULT_CONFIG;expect(validConfig(old)).toEqual(DEFAULT_CONFIG);});
 it('resolves the selected model',()=>expect(getVehicle({...DEFAULT_CONFIG,vehicle:'terra'}).kind).toBe('suv'));
 it('calculates the default price',()=>expect(estimate(DEFAULT_CONFIG)).toBe(224400));
 it('adds every selected option',()=>expect(estimate({...DEFAULT_CONFIG,wheels:'turbine',finish:'satin',package:'performance'})).toBe(240300));
 it('rejects unknown options',()=>expect(validConfig({...DEFAULT_CONFIG,color:'fake'})).toBeNull());
 it('rejects incomplete imported configurations',()=>expect(validConfig({color:'red'})).toBeNull());
 it('strips untrusted extra properties',()=>expect(validConfig({...DEFAULT_CONFIG,total:1})).toEqual(DEFAULT_CONFIG));
 it('keeps catalog identifiers unique',()=>{for(const key of ['colors','wheels','interiors','finishes','packages'])expect(new Set(CATALOG[key].map(x=>x.id)).size).toBe(CATALOG[key].length);});
 it('sends write protection header',async()=>{const fetch=vi.fn().mockResolvedValue({ok:true,status:201,json:async()=>({id:'x'})});vi.stubGlobal('fetch',fetch);await api('/designs',{configuration:DEFAULT_CONFIG});expect(fetch.mock.calls[0][1].headers['X-Studio-Client']).toBe('drive-studio');});
 it('surfaces server errors',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:409,json:async()=>({detail:'Limit reached'})}));await expect(api('/designs',{})).rejects.toThrow('Limit reached');});
 it('handles empty delete responses',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:204}));await expect(api('/designs/x',undefined,'DELETE')).resolves.toBeNull();});
});
