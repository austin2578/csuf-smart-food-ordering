
const express=require("express");const cors=require("cors");const fs=require("fs");
const app=express();app.use(express.json());app.use(cors());
const FILE="./menu-data.json";
const read=()=>JSON.parse(fs.readFileSync(FILE));
const writef=d=>fs.writeFileSync(FILE,JSON.stringify(d,null,2));
app.get("/menu",(req,res)=>res.json(read()));
app.post("/menu",(req,res)=>{let d=read();let n={id:d.length?Math.max(...d.map(i=>i.id))+1:1,...req.body};d.push(n);writef(d);res.json(n);});
app.delete("/menu/:id",(req,res)=>{let d=read().filter(i=>i.id!=req.params.id);writef(d);res.json({ok:true});});
app.listen(3001,()=>console.log("menu 3001"));
