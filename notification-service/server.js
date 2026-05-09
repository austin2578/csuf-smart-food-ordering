
const express=require("express");const cors=require("cors");
const app=express();app.use(express.json());app.use(cors());
app.post("/notify",(req,res)=>{console.log("Order",req.body.orderId,"READY");res.json({ok:true});});
app.listen(3003,()=>console.log("notif 3003"));
