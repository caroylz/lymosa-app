const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const VERDE='#1D9E75',VERDE_LIGHT='#E1F5EE',GRIS_TEXTO='#444441',GRIS_CLARO='#D3D1C7',NEGRO='#1A1A1A',BLANCO='#FFFFFF';
const PW=612,PH=792,ML=50,MR=50;
function dibujarPlaceholder(doc,x,y,w,h){doc.rect(x,y,w,h).fill('#B4B2A9');doc.fontSize(8).fillColor('#555').font('Helvetica').text('FOTO DE EVIDENCIA',x,y+h/2-6,{width:w,align:'center'});}
function dibujarPagina(doc,datos,foto1Path,foto2Path){
doc.rect(0,0,PW,50).fill(VERDE);
doc.fontSize(6.5).fillColor(BLANCO).font('Helvetica').text('LYMOSA ENERGY S.A. DE C.V.   RFC: LEN201109P97   TEL: 8184784675',ML,12,{width:PW-ML-MR-60});
doc.fontSize(6).text('Perif. Luis Echeverría Álvarez, #1957 Ote., esquina con Blvd. Nazario Ortiz Garza, en Saltillo, Coah. C.P. 25280.',ML,24,{width:PW-ML-MR-60});
doc.circle(PW-35,25,16).fill('rgba(255,255,255,0.15)');
doc.fontSize(13).fillColor(NEGRO).font('Helvetica-Bold').text('REPORTE DE EVIDENCIA FOTOGRAFICA DE DESCARGAS',ML,68,{width:PW-ML-MR,align:'center'});
doc.moveTo(ML,88).lineTo(PW-MR,88).strokeColor(VERDE).lineWidth(1.5).stroke();
doc.fontSize(9).fillColor(GRIS_TEXTO).font('Helvetica').text('LUGAR Y FECHA: Saltillo Coahuila a '+datos.fecha_dia+' de '+datos.fecha_mes+' de '+datos.fecha_anio+'.',ML,100,{width:PW-ML-MR,align:'right'});
const cajaY=118;
doc.roundedRect(ML,cajaY,PW-ML-MR,46,4).fillAndStroke(VERDE_LIGHT,VERDE);
doc.fontSize(9).fillColor(GRIS_TEXTO).font('Helvetica-Bold').text('NÚMERO DE EMBARQUE:',ML+10,cajaY+8);
doc.font('Helvetica').text(datos.numero_embarque,ML+155,cajaY+8);
doc.font('Helvetica-Bold').text('PRODUCTO:',ML+10,cajaY+26);
doc.font('Helvetica').text(datos.producto,ML+155,cajaY+26);
doc.font('Helvetica-Bold').text('ESTACIÓN DE SERVICIO:',PW/2+10,cajaY+8);
doc.font('Helvetica').text(datos.estacion,PW/2+155,cajaY+8);
const evY=176;
doc.fontSize(10).font('Helvetica-Bold').fillColor(NEGRO).text('EVIDENCIA:',ML,evY);
doc.moveTo(ML+72,evY+6).lineTo(PW-MR,evY+6).strokeColor(GRIS_CLARO).lineWidth(0.5).stroke();
const fotoW=(PW-ML-MR-14)/2,fotoH=220,fotoY=evY+18;
[[foto1Path,'Foto 1 — Muestra inicial',0],[foto2Path,'Foto 2 — Purgado final',1]].forEach(([fp,label,i])=>{
const x=ML+i*(fotoW+14);
doc.roundedRect(x,fotoY,fotoW,fotoH,4).fillAndStroke(VERDE_LIGHT,VERDE);
doc.rect(x,fotoY,fotoW,16).fill(VERDE);
doc.fontSize(7.5).fillColor(BLANCO).font('Helvetica-Bold').text(label,x,fotoY+4,{width:fotoW,align:'center'});
const imgX=x+4,imgY=fotoY+18,imgW=fotoW-8,imgH=fotoH-22;
if(fp&&fs.existsSync(fp)){try{doc.image(fp,imgX,imgY,{width:imgW,height:imgH,fit:[imgW,imgH],align:'center',valign:'center'});}catch(e){dibujarPlaceholder(doc,imgX,imgY,imgW,imgH);}}
else{dibujarPlaceholder(doc,imgX,imgY,imgW,imgH);}
});
doc.rect(0,PH-38,PW,38).fill(VERDE);
doc.fontSize(7.5).font('Helvetica-Bold').fillColor(BLANCO).text('LYMOSA ENERGY S.A. DE C.V.',ML,PH-28);
doc.fontSize(6.5).font('Helvetica').fillColor(BLANCO).text('RFC: LEN201109P97   TEL: 8184784675',ML,PH-17);
doc.text('Perif. Luis Echeverría Álvarez, #1957 Ote., esquina con Blvd. Nazario Ortiz Garza, en Saltillo, Coah. C.P. 25280.',ML,PH-17,{width:PW-ML-MR,align:'right'});
}
function generarReporte(data,outputPath){return new Promise((resolve,reject)=>{const doc=new PDFDocument({size:'letter',margin:0,autoFirstPage:false});const stream=fs.createWriteStream(outputPath);doc.pipe(stream);doc.addPage();dibujarPagina(doc,data.embarque1,data.embarque1.foto1,data.embarque1.foto2);doc.addPage();dibujarPagina(doc,data.embarque2,data.embarque2.foto1,data.embarque2.foto2);doc.end();stream.on('finish',()=>resolve(outputPath));stream.on('error',reject);});}
module.exports={generarReporte};
