const express = require("express");
const router = express.Router();
const Book = require("../models/book");
const Author = require("../models/author");
const multer = require("multer");
const path = require("path");
const uploadPath = path.join("public", Book.coverImageBasePath);
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
const fs = require("fs");

const upload = multer({
  dest: uploadPath,
  fileFilter: (req, file, callback) => {
    callback(null, imageMimeTypes.includes(file.mimetype));
  },
});

// all books
router.get("/", async (req, res) => {
  let query = Book.find();
  if (req.query.title != null && req.query.title != "") {
    query = query.regex("title", new RegExp(req.query.title, "i"));
  }
  if (req.query.publishedBefore != null && req.query.publishedBefore != "") {
    query = query.lte("publishDate", req.query.publishedBefore);
  }
  if (req.query.publishedAfter != null && req.query.publishedAfter != "") {
    query = query.gte("publishDate", req.query.publishedAfter);
  }
  try {
    const books = await query.exec();
    res.render("books/index", { books, searchOptions: req.query });
  } catch {
    res.redirect("/");
  }
});

// for creating a new book
router.get("/new", async (req, res) => {
  renderNewPage(res, new Book());
});

// Create book route
router.post("/", upload.single("cover"), async (req, res) => {
  const fileName = req.file != null ? req.file.filename : null;
  const book = new Book({
    title: req.body.title,
    description: req.body.description,
    publishDate: new Date(req.body.publishDate),
    pageCount: req.body.pageCount,
    coverImageName: fileName,
    author: req.body.author,
  });

  try {
    const newBook = await book.save();
    res.redirect(`books/${newBook.id}`);
  } catch (err) {
    if (book.coverImageName != null) {
      removeBookCover(book.coverImageName);
    }
    renderNewPage(res, book, true);
  }
});

async function renderNewPage(res, book, hasError = false) {
  renderForm(res, book, "new", hasError);
}

async function renderEditPage(res, book, hasError = false) {
  renderForm(res, book, "edit", hasError);
}

async function renderForm(res, book, form, hasError = false) {
  try {
    const authors = await Author.find({});
    const params = {
      authors,
      book,
    };
    if (hasError) {
      if (form === "edit") {
        params.errorMessage = "Error Updating Book";
      } else {
        params.errorMessage = "Error Creating Book";
      }
    }
    res.render(`books/${form}`, params);
  } catch {
    res.redirect("/books");
  }
}

function removeBookCover(fileName) {
  fs.unlink(path.join(uploadPath, fileName), (err) => {
    if (err) console.err(err);
  });
}

router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate("author").exec();
    res.render("books/show", { book });
  } catch {
    res.redirect("/");
  }
});

router.get("/:id/edit", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    renderEditPage(res, book);
  } catch {
    res.redirect("/");
  }
});

router.put("/:id", async (req, res) => {
  let book;
  try {
    book = await Book.findById(req.params.id);
    book.title = req.body.title;
    book.author = req.body.author;
    book.publishDate = new Date(req.body.publishDate);
    book.pageCount = req.body.pageCount;
    book.description = req.body.description;
    if (req.body.cover != null && req.body.cover != "") {
      saveCover(book, req.body.cover);
    }
    await book.save();
    res.redirect(`/books/${book.id}`);
  } catch (err) {
    if (book != null) {
      renderEditPage(res, book, true);
    } else {
      redirect("/");
    }
  }
});

router.delete("/:id", async (req, res) => {
  let book;
  try {
    book = await Book.findById(req.params.id);
    await book.remove();
    res.redirect("/books");
  } catch {
    if (book == null) {
      res.redirect("/");
    } else {
      res.redirect(`/book/${book.id}`);
    }
  }
});

module.exports = router;
