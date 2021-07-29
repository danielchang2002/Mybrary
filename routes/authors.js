const express = require("express");
const router = express.Router();
const Author = require("../models/author");

// all authors
router.get("/", async (req, res) => {
  let searchOptions = {};
  if (req.query.name) {
    searchOptions.name = new RegExp(req.query.name, "i");
  }
  try {
    const authors = await Author.find(searchOptions);
    res.render("authors/index", { authors, searchOptions: req.query });
  } catch {
    res.redirect("/");
  }
});

// for creating a new author
router.get("/new", (req, res) => {
  res.render("authors/new", { author: new Author() });
  // res.render("authors/new", {});
});

router.post("/", async (req, res) => {
  const author = new Author({
    name: req.body.name,
  });
  try {
    const newAuthor = await author.save();
    res.redirect("authors");
  } catch {
    res.render("authors/new", {
      author: author,
      errorMessage: "Error creating Author",
    });
  }
});

module.exports = router;
