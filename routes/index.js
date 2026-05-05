const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("index", { title: "Home", page: "home" });
});

router.get("/about", (req, res) => {
  res.render("about", { title: "About Us", page: "about" });
});

router.get("/programs", (req, res) => {
  res.render("programs", { title: "Our Programs", page: "programs" });
});

router.get("/donate", (req, res) => {
  res.render("donate", { title: "Donate", page: "donate" });
});

router.get("/contact", (req, res) => {
  res.render("contact", { title: "Contact", page: "contact" });
});

module.exports = router;
