import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect} from 'vitest';
import ConceptPoster from './ConceptPoster';
import {VEHICLES,DEFAULT_CONFIG} from './config';
it('renders nine distinct fallback body outlines instead of repeating one car',()=>{
 const outlines=VEHICLES.filter(v=>v.kind!=='asset').map(vehicle=>{
  const html=renderToStaticMarkup(<ConceptPoster vehicle={vehicle} config={{...DEFAULT_CONFIG,vehicle:vehicle.id}} caption="2D"/>);
  const doc=new DOMParser().parseFromString(html,'text/html');
  expect(doc.querySelector('svg').getAttribute('aria-label')).toContain(vehicle.name);
  return doc.querySelector('polygon').getAttribute('points');
 });
 expect(new Set(outlines).size).toBe(9);
});
