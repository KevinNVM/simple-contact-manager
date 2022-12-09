const express = require("express");
const expressEjsLayouts = require("express-ejs-layouts");
const { body, validationResult, check } = require("express-validator");
const [session, cookieParser, flash] = [
  require("express-session"),
  require("cookie-parser"),
  require("connect-flash"),
];
const app = express();
const {
  loadContacts,
  findContact,
  addContact,
  checkForDuplicate,
  deleteContact,
  updateContacts,
} = require("./app/contacts");
const PORT = process.env.PORT || 3000;

// Config flash
app.use(cookieParser("secret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressEjsLayouts);

// design file
app.use(express.static("public"));
app.set("view engine", "ejs");

// routers
app.get("/", (req, res) => {
  res.render("index", { layout: "layouts/main" });
});

app.get("/contacts", (req, res) => {
  const contacts = loadContacts();
  res.render("contacts", {
    layout: "layouts/main",
    title: "Contacts",
    contacts,
    msg: req.flash("msg"),
  });
});

app.get("/contacts/new", (req, res) => {
  res.render("new", {
    title: "Add New Contact",
    layout: "layouts/main",
  });
});

app.get("/contact/:name/edit", (req, res) => {
  res.render("edit", {
    title: `Edit ${req.params.name}`,
    layout: "layouts/main",
    contact: findContact(req.params.name),
  });
});

app.get("/contact/:name/delete", (req, res) => {
  const contact = findContact(req.params.name || "");
  if (!contact) {
    res.status(404);
    res.send("404");
  } else {
    deleteContact(req.params.name);
    req.flash("msg", "Contact Deleted!");
    res.redirect("/contacts");
  }
});

app.get("/contact/:name", (req, res) => {
  const contact = findContact(req.params.name);
  res.render("show", {
    layout: "layouts/main",
    title: "Contacts",
    contact,
  });
});

app.post(
  "/contacts",
  [
    body("name").custom((value) => {
      const duplicate = checkForDuplicate(value);
      if (duplicate) {
        throw new Error("Contact Already Exists");
      }
      return true;
    }),
    body("nohp", "Phone Number is not Valid!").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      res.render("new", {
        title: "Add New Contact",
        layout: "layouts/main",
        errors: errors.array(),
        old: req.body,
      });
    else {
      addContact(req.body);

      req.flash("msg", "Added New Contact!");

      res.redirect("/contacts");
    }
  }
);

app.post(
  "/contacts/update",
  [
    body("name").custom((value, { req }) => {
      const duplicate = checkForDuplicate(value);
      if (value !== req.body.oldName && duplicate)
        throw new Error("Contact Already Exists");
      return true;
    }),
    body("nohp", "Phone Number is not Valid!").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      res.render("edit", {
        title: "Edit Contact",
        layout: "layouts/main",
        errors: errors.array(),
        contact: req.body,
      });
    else {
      updateContacts(req.body);
      req.flash("msg", "Contact Updated!");
      res.redirect("/contacts");
    }
  }
);

app.use((req, res) => {
  res.send("404 Page Not Found");
});

// server listening
app.listen(PORT, () => {
  console.log(`App listening on http://localhost:${PORT}`);
});
