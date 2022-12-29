const express = require("express");
const expressEjsLayouts = require("express-ejs-layouts");
const { body, validationResult, check } = require("express-validator");
const [session, cookieParser, flash] = [
  require("express-session"),
  require("cookie-parser"),
  require("connect-flash"),
];
require("./app/db");
const methodOverride = require("method-override");

const Contact = require("./Models/Contact");

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

app.use(methodOverride("_method"));
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

app.get("/contacts", async (req, res) => {
  const contacts = await Contact.find();
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

app.delete("/contacts", async (req, res) => {
  const contact = await Contact.findOne({ name: req.body.name });
  if (!contact) {
    res.status(404);
    res.send("404");
  } else {
    await Contact.deleteOne({ name: contact.name });
    req.flash("msg", "Contact Deleted!");
    res.redirect("/contacts");
  }
});

app.get("/contact/:name", async (req, res) => {
  // const contact = findContact(req.params.name);
  const contact = await Contact.findOne({ name: req.params.name });

  res.render("show", {
    layout: "layouts/main",
    title: "Contacts",
    contact,
  });
});

app.post(
  "/contacts",
  [
    body("name").custom(async (value) => {
      const duplicate = await Contact.findOne({ name: value });
      if (duplicate) {
        throw new Error("Contact Already Exists");
      }
      return true;
    }),
    body("nohp", "Phone Number is not Valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      res.render("new", {
        title: "Add New Contact",
        layout: "layouts/main",
        errors: errors.array(),
        old: req.body,
      });
    else {
      await Contact.insertMany(req.body);

      req.flash("msg", "Added New Contact!");

      res.redirect("/contacts");
    }
  }
);

app.put(
  "/contacts",
  [
    body("name").custom(async (value, { req }) => {
      const duplicate = await Contact.findOne({ name: value });
      if (value !== req.body.oldName && duplicate)
        throw new Error("Contact Already Exists");
      return true;
    }),
    body("nohp", "Phone Number is not Valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      res.render("edit", {
        title: "Edit Contact",
        layout: "layouts/main",
        errors: errors.array(),
        contact: req.body,
      });
    else {
      await Contact.updateOne(
        { name: req.body.oldName },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            nohp: req.body.nohp,
          },
        }
      );
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
