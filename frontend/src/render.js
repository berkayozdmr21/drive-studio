export function exportDimensions(width,aspect,maxTextureSize){
 if(!Number.isFinite(width)||width<1||!Number.isFinite(aspect)||aspect<=0)throw new Error('Geçersiz render boyutu.');
 const height=Math.max(1,Math.round(width/aspect));
 if(width>maxTextureSize||height>maxTextureSize)throw new Error('Bu cihaz seçilen çözünürlüğü desteklemiyor. Daha küçük çözünürlük seç.');
 return {width:Math.round(width),height};
}
