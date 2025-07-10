const express = require("express");
const multer = require("multer");
const path = require("path");
const con = require("./config");
const app = express();

// Upload File 
const storage = multer.diskStorage({
  destination : function (r,file,cb){
    cb(null,"public/upload")
  },
  filename:function(r,file,cb){
    const uniqueName = Date.now() + " - "+Math.round(Math.random() * 1E9);
    cb(null,uniqueName + path.extname(file.originalname)) 
  }
})

const upload = multer({storage : storage});


// middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

con.connect((e) => {
  if (e) throw e;
});

function formatDate(dateStr,sep = '/'){
  const date = new Date(dateStr);
  const d = String(date.getDate()).padStart(2,'0');
  const m = String(date.getMonth()+1).padStart(2,'0');
  const y = date.getFullYear();
  // return `${d}/${m}/${y}`;
  return d+sep+m+sep+y;
}

// Routes
app.get("/", (r, res) => {
  const search = r.query.search || "";
  sql = "SELECT * FROM contact"

  if(search){
    sql += ` WHERE firstName LIKE '%${search}%' OR email LIKE '%${search}%'`
    // res.end(sql);
  }
  con.query(sql, (e, r) => {
    if (e){
       return res.status(500).send("Error : "+e);
    }
    res.render("home", { data: r ,search});
  });
});
app.get("/show-contact", (r, res) => {
    if(!r.query.id){
        res.send("Invalid ID")
    }
    let sql = "SELECT * FROM `contact` WHERE `id` = "+r.query.id;
    con.query(sql,(e,r)=>{
      if (e) {
        res.status(500).send("ERROR");
      }
      r[0].birthday = formatDate(r[0].birthday)
      console.log( r[0])
      res.render("show-contact",{d : r[0]});
    })  
});
app.get("/add-contact", (r, res) => {
  res.render("add-contact");
});
app.post("/add-contact", upload.single("profileUpload"),(r, res) => {
  const filepath = r.file ? "/upload/" + r.file.filename : "";

  let sql =
    "INSERT INTO `contact`(`profileUpload`, `firstName`, `lastName`, `birthday`, `gender`, `jobTitle`, `company`, `phone`, `mobile`, `email`, `website`, `address`, `city`, `state`, `zip`, `twitter`, `facebook`, `linkedin`) VALUES (" +
    "'" +
    filepath +
    "','" +
    r.body.firstName +
    "','" +
    r.body.lastName +
    "','" +
    r.body.birthday +
    "','" +
    r.body.gender +
    "','" +
    r.body.jobTitle +
    "','" +
    r.body.company +
    "','" +
    r.body.phone +
    "','" +
    r.body.mobile +
    "','" +
    r.body.email +
    "','" +
    r.body.website +
    "','" +
    r.body.address +
    "','" +
    r.body.city +
    "','" +
    r.body.state +
    "','" +
    r.body.zip +
    "','" +
    r.body.twitter +
    "','" +
    r.body.facebook +
    "','" +
    r.body.linkedin +
    "')";
  con.query(sql, (e, result) => {
    if (e) throw e;
    if (result.insertId >= 0) {
      res.status(201);
      res.json({
        msg: "Record Inserted",
      });
        res.redirect("/");

    } else {
      res.status(412);
      res.json({
        msg: "Record Failed",
      });

    }
    res.send(result);
  });
});
app.get("/update-contact", (r, res) => {
  sql = "SELECT * FROM `contact` WHERE id = "+r.query.id;
  con.query(sql,(e,r)=>{
    if (e) {
      res.status(500).send("Error");
    }
    console.log(r[0]);
    r[0].birthday = formatDate(r[0].birthday,'');
  res.render("update-contact",{d : r[0]});

  });
});
app.post("/update-contact",upload.single("profileUpload"), (r, res) => {
  const filepath = r.file ? "/upload/" + r.file.filename : r.body.oldProfileUpload;
  sql = "UPDATE `contact` SET `profileUpload`='"+filepath+"',`firstName`='"+r.body.firstName+"',`lastName`='"+r.body.lastName+"',`birthday`='"+r.body.birthday+"',`gender`='"+r.body.gender+"',`jobTitle`='"+r.body.jobTitle+"',`company`='"+r.body.company+"',`phone`='"+r.body.phone+"',`mobile`='"+r.body.mobile+"',`email`='"+r.body.email+"',`website`='"+r.body.website+"',`address`='"+r.body.address+"',`city`='"+r.body.address+"',`state`='"+r.body.state+"',`zip`='"+r.body.zip+"',`twitter`='"+r.body.twitter+"',`facebook`='"+r.body.facebook+"',`linkedin`='"+r.body.linkedin+"',`instagram`='"+r.body.instagram+"',`notes`='"+r.body.notes+"' WHERE id = "+r.body.id;
  // res.send(sql);
  con.query(sql,(e,result)=>{
    if (e) {
      res.status(500).send("error"+e);
    }
    if(result.affectedRows){
      res.redirect('/');
    }
  })
});
app.get("/delete-contact", (r, res) => {
  sql =  "DELETE FROM `contact` WHERE id="+r.query.id;
  con.query(sql,(e,result)=>{
    if(e){
      res.status(500).send("error"+e);
    }
    if(result.affectedRows != 0){
      res.redirect('/'); 
    }else{
      res.status({msg : "Not Deleted"})
    }
  })
});


app.listen(4000, () => {
  console.log("http://localhost:4000");
});
