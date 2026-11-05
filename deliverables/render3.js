const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const mode=process.argv[2];
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1920,height:1080}});
 pg.on('console',m=>console.log('PAGE',m.text()));pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.goto('http://127.0.0.1:8765/v3.html');await pg.evaluate(()=>init());

 async function shot(t,base){
   await pg.evaluate(t=>render(t),t);
   // Extract scene canvas via toDataURL (avoids black screenshot bug)
   const scData=await pg.evaluate(()=>{
     const c=document.getElementById('sc');return c.toDataURL('image/jpeg',0.95);
   });
   fs.writeFileSync(base+'_s.jpg',Buffer.from(scData.split(',')[1],'base64'));
   // Extract UI canvas via toDataURL as PNG with transparency
   const uiData=await pg.evaluate(()=>{
     const c=document.getElementById('ui');return c.toDataURL('image/png');
   });
   fs.writeFileSync(base+'_u.png',Buffer.from(uiData.split(',')[1],'base64'));
 }

 if(mode==='preview'){
   fs.mkdirSync('pv3',{recursive:true});
   const ts=process.argv.slice(3).map(Number);
   for(const t of ts){await shot(t,`pv3/${t}`)}
 } else {
   const [a,bb]=[+process.argv[3],+process.argv[4]];
   fs.mkdirSync('seq3',{recursive:true});
   for(let i=a;i<bb;i++){
     await pg.evaluate(t=>render(t),i/30);
     const scData=await pg.evaluate(()=>{
       const c=document.getElementById('sc');return c.toDataURL('image/jpeg',0.94);
     });
     fs.writeFileSync(`seq3/s${String(i).padStart(4,'0')}.jpg`,Buffer.from(scData.split(',')[1],'base64'));
     const t=i/30;
     if(t>=22.4&&t<26.7){
       const uiData=await pg.evaluate(()=>{
         const c=document.getElementById('ui');return c.toDataURL('image/png');
       });
       fs.writeFileSync(`seq3/u${String(i).padStart(4,'0')}.png`,Buffer.from(uiData.split(',')[1],'base64'));
     }
   }
 }
 await b.close();})();
