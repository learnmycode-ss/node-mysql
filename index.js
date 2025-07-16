const express = require("express");
const multer = require("multer");
const path = require("path");
const con = require("./config");
const app = express();

// Upload File
const storage = multer.diskStorage({
  destination: function (r, file, cb) {
    cb(null, "public/upload");
  },
  filename: function (r, file, cb) {
    const uniqueName = Date.now() + " - " + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
  limit: {
    fileSize: 5 * 1024 * 1024,
  },
});

const upload = multer({ storage: storage });

// middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

con.connect((e) => {
  if (e) throw e;
});

function formatDate(dateStr, sep = "/") {
  const date = new Date(dateStr);
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  // return `${d}/${m}/${y}`;
  return d + sep + m + sep + y;
}

// Routes
app.get("/", (r, res) => {
  const search = r.query.search || "";
  const page = parseInt(r.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  let baseSql = "FROM contact";
  let whereClause = "";
  let values = [];

  if (search) {
    whereClause = ` WHERE firstName LIKE ? OR email LIKE ?`;
    values.push(`%${search}%`, `%${search}%`);
  }

  const countSql = `SELECT COUNT(*) AS count ${baseSql} ${whereClause}`;

  con.query(countSql, values, (e, countResult) => {
    if (e) return res.status(400).send("Count Query Errors: " + e);

    const totalItem = countResult[0].count;
    const totalPage = Math.ceil(totalItem / limit);

    const dataSql = `SELECT * ${baseSql} ${whereClause} LIMIT ? OFFSET ?`;
    con.query(dataSql, [...values, limit, offset], (e, result) => {
      if (e) return res.status(500).send("Data Query Error");
      res.render("home", {
        data: result,
        search,
        currenrPage: page,
        totalPage,
      });
    });
  });
});

app.get("/show-contact", (r, res) => {
  if (!r.query.id) {
    res.send("Invalid ID");
  }
  let sql = "SELECT * FROM `contact` WHERE `id` = " + r.query.id;
  con.query(sql, (e, r) => {
    if (e) {
      res.status(500).send("ERROR");
    }
    r[0].birthday = formatDate(r[0].birthday);
    res.render("show-contact", { d: r[0] });
  });
});

app.get("/add-contact", (r, res) => {
  res.render("add-contact");
});

app.post("/add-contact", upload.single("profileUpload"), (r, res) => {
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
      res.redirect("/");
    } else {
      res.status(412);
      res.json({
        msg: "Record Failed",
      });
    }
  });
});

app.get("/update-contact", (r, res) => {
  sql = "SELECT * FROM `contact` WHERE id = " + r.query.id;
  con.query(sql, (e, r) => {
    if (e) {
      res.status(500).send("Error");
    }
    r[0].birthday = formatDate(r[0].birthday, "");
    res.render("update-contact", { d: r[0] });
  });
});

app.post("/update-contact", upload.single("profileUpload"), (r, res) => {
  const filepath = r.file
    ? "/upload/" + r.file.filename
    : r.body.oldProfileUpload;
  sql =
    "UPDATE `contact` SET `profileUpload`='" +
    filepath +
    "',`firstName`='" +
    r.body.firstName +
    "',`lastName`='" +
    r.body.lastName +
    "',`birthday`='" +
    r.body.birthday +
    "',`gender`='" +
    r.body.gender +
    "',`jobTitle`='" +
    r.body.jobTitle +
    "',`company`='" +
    r.body.company +
    "',`phone`='" +
    r.body.phone +
    "',`mobile`='" +
    r.body.mobile +
    "',`email`='" +
    r.body.email +
    "',`website`='" +
    r.body.website +
    "',`address`='" +
    r.body.address +
    "',`city`='" +
    r.body.address +
    "',`state`='" +
    r.body.state +
    "',`zip`='" +
    r.body.zip +
    "',`twitter`='" +
    r.body.twitter +
    "',`facebook`='" +
    r.body.facebook +
    "',`linkedin`='" +
    r.body.linkedin +
    "',`instagram`='" +
    r.body.instagram +
    "',`notes`='" +
    r.body.notes +
    "' WHERE id = " +
    r.body.id;
  // res.send(sql);
  con.query(sql, (e, result) => {
    if (e) {
      res.status(500).send("error" + e);
    }
    if (result.affectedRows) {
      res.redirect("/");
    }
  });
});

app.get("/delete-contact", (r, res) => {
  sql = "DELETE FROM `contact` WHERE id=" + r.query.id;
  con.query(sql, (e, result) => {
    if (e) {
      res.status(500).send("error" + e);
    }
    if (result.affectedRows != 0) {
      res.redirect("/");
    } else {
      res.status({ msg: "Not Deleted" });
    }
  });
});

app.get("/favorite", (r, res) => {
  const search = r.query.search || "";
  const page = parseInt(r.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  let baseSql = "FROM contact";
  let whereClause = " WHERE fav = 1";
  let values = [];

  if (search) {
    whereClause += ` AND firstName LIKE ? OR email LIKE ?`;
    values.push(`%${search}%`, `%${search}%`);
  }

  const countSql = `SELECT COUNT(*) AS count ${baseSql} ${whereClause}`;

  con.query(countSql, values, (e, countResult) => {
    if (e) {
      return res.status(400).send("Count Qyery Errors");
    }

    const totalItem = countResult[0].count;
    const totalPage = Math.ceil(totalItem / limit);

    const dataSql = `SELECT * ${baseSql} ${whereClause} LIMIT ? OFFSET ?`;
    con.query(dataSql, [...values, limit, offset], (e, result) => {
      if (e) return res.status(500).send("Data Query Error");

      res.render("favorit", {
        data: result,
        search,
        currenrPage: page,
        totalPage,
      });
    });
  });
});

app.get("/favset", (r, resp) => {
  if (r.query.id || r.query.id != "") {
    let id = r.query.id;
    let sql = `UPDATE contact SET fav = 1 WHERE id = ${id}`;
    con.query(sql, (e, result) => {
      if (e) {
        return resp.status(400).send("Error");
      }
      if (result.affectedRows != 0) {
        resp.redirect("/show-contact?id=" + id);
      } else {
        resp.send(result.message);
      }
    });
  } else {
    resp.status(404).send("Not Found");
  }
});

app.get("/favrm", (r, resp) => {
  if (r.query.id || r.query.id != "") {
    let id = r.query.id;
    let sql = `UPDATE contact SET fav = 0 WHERE id = ${id}`;
    con.query(sql, (e, result) => {
      if (e) {
        return resp.status(400).send("Error");
      }
      if (result.affectedRows != 0) {
        resp.redirect("/favorite");
      } else {
        resp.send(result.message);
      }
    });
  } else {
    resp.status(404).send("Not Found");
  }
});

app.get("/groups", (r, res) => {
  // let sql = `SELECT * FROM contact WHERE id IN (${data.member})`;
  let sql = `SELECT * FROM groups`;
  con.query(sql, (e, result) => {
    if (e) throw e;
    // console.log(result);
    res.render("group", { g: result });
  });
});

app.get("/group-view", (r, res) => {
  let id = r.query.id;
  if (!id) {
    res.send("Error");
  }
  let sql = `SELECT * FROM groups WHERE id = ${id} limit 1`;
  con.query(sql, (e, result) => {
    if (e) throw e;
    let arrayRes = result[0].member.split(",");
    let cdata;
    let sql2 = `SELECT * FROM contact WHERE id IN (${arrayRes})`;
    con.query(sql2, (e2, r2) => {
      if (e2) throw e2;
      cdata = r2;
      res.render("show-group", { g: result[0],c:cdata });
    });
  });
  // res.render("show-group");
});

app.get("/create-group", (r, res) => {
  let sql = "SELECT * FROM `contact`";
  let contact;
  con.query(sql, (e, result) => {
    if (e) throw e;
    // console.log(result);
    res.render("create-group", { contact: result });
  });
});

app.post("/create-group", upload.single("profileUpload"), (r, res) => {
  // console.log("File received:", r.file);
  // console.log("Body received:", r.body);
  console.log(r.body);
  const filepath = r.file ? "upload/" + r.file.filename : "";
  const members = r.body["members[]"] || [];
  if (!Array.isArray(members)) {
    members = [members];
  }
  const conId = members.join(","); // Joins as "2,4"
  let sql = `INSERT INTO groups(groupUpload, groupName, groupDescription, member) VALUES ('${filepath}','${r.body.groupName}','${r.body.groupDescription}','${conId}')`;
  con.query(sql, (e, result) => {
    if (e) throw e;
    // console.log(result);
    // console.log("::" + filepath);
    res.redirect("/groups");
  });
});

app.get("/group-edit", (r, res) => {
  res.render("edit-group");
});

app.get("/group-delete", (r, res) => {
  let sql = "DELETE FROM groups WHERE id = " + r.query.id;
  // console.log(sql);
  con.query(sql, (e, result) => {
    if (e) throw e;
    // console.log(result);
    res.redirect("/groups");
  });
});
app.get("/login", (r, res) => {
  res.render("login");
});

app.get("/settings", (r, res) => {
  res.render("settings");
});

app.listen(4000, () => {
  console.log("http://localhost:4000");
});
