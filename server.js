const express=require('express');
const nodemailer=require('nodemailer');
const fs=require('fs');
const path=require('path');
const os=require('os');
const {generarReporte}=require('./generar_pdf');
const app=express();
app.use(express.json({limit:'50mb'}));
app.use(express.static(__dirname));
const CONFIG={
  email_destino:process.env.EMAIL_DESTINO,
  email_origen:process.env.EMAIL_ORIGEN,
  email_password:process.env.EMAIL_PASSWORD,
  puerto:process.env.PORT||3000,
};
app.post('/api/reporte',async(req,res)=>{
  const{estacion,embarque1,embarque2,fecha}=req.body;
  if(!embarque1?.numero||!embarque2?.numero)return res.status(400).json({error:'Faltan datos'});
  const tmpDir=fs.mkdtempSync(path.join(os.tmpdir(),'lymosa-'));
  try{
    const rutas={};
    for(const[emb,datos]of[['embarque1',embarque1],['embarque2',embarque2]]){
      for(const num of[1,2]){
        const base64=datos[`foto${num}`];
        if(base64){
          const ext=base64.includes('image/png')?'png':'jpg';
          const ruta=path.join(tmpDir,`${emb}_foto${num}.${ext}`);
          fs.writeFileSync(ruta,Buffer.from(base64.replace(/^data:image\/\w+;base64,/,''),'base64'));
          rutas[`${emb}_foto${num}`]=ruta;
        }
      }
    }
    const pdfPath=path.join(tmpDir,'reporte.pdf');
    await generarReporte({
      embarque1:{numero_embarque:embarque1.numero,producto:embarque1.producto,estacion,fecha_dia:fecha.dia,fecha_mes:fecha.mes,fecha_anio:fecha.anio,foto1:rutas['embarque1_foto1']||null,foto2:rutas['embarque1_foto2']||null},
      embarque2:{numero_embarque:embarque2.numero,producto:embarque2.producto,estacion,fecha_dia:fecha.dia,fecha_mes:fecha.mes,fecha_anio:fecha.anio,foto1:rutas['embarque2_foto1']||null,foto2:rutas['embarque2_foto2']||null}
    },pdfPath);
    const transporter=nodemailer.createTransport({service:'gmail',auth:{user:CONFIG.email_origen,pass:CONFIG.email_password}});
    await transporter.sendMail({
      from:`"Lymosa Energy" <${CONFIG.email_origen}>`,
      to:CONFIG.email_destino,
      subject:`Reporte Lymosa — Est.14978 — Emb.${embarque1.numero}/${embarque2.numero} — ${fecha.dia} ${fecha.mes} ${fecha.anio}`,
      html:`<p>Reporte adjunto — Embarques ${embarque1.numero} y ${embarque2.numero} — Estación 14978</p>`,
      attachments:[{filename:`reporte_${embarque1.numero}_${embarque2.numero}.pdf`,path:pdfPath,contentType:'application/pdf'}]
    });
    fs.rmSync(tmpDir,{recursive:true,force:true});
    res.json({ok:true});
  }catch(err){
    console.error('Error:',err.message);
    try{fs.rmSync(tmpDir,{recursive:true,force:true});}catch{}
    res.status(500).json({error:err.message});
  }
});
app.listen(CONFIG.puerto,()=>console.log(`Lymosa Energy corriendo en puerto ${CONFIG.puerto}`));
