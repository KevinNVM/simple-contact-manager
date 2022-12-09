const fs = require("fs");
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const dirPath = "./data";
if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);

const dataPath = "./data/contacts.json";
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, "[]", "utf-8");

const getInitials = (name) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join(".");
};

/**
 * Load all contacts in json file
 * @returns {JSON}
 */
const loadContacts = () => {
  return JSON.parse(fs.readFileSync("data/contacts.json", "utf-8"));
};

/**
 * Find contact in json file
 * @returns {JSON}
 */
const findContact = (name) => {
  const contacts = loadContacts();
  return (contact = contacts.find(
    (contact) => contact.name.toLowerCase() === name.toLowerCase()
  ));
};

const saveContacts = (contacts) => {
  fs.writeFileSync("data/contacts.json", JSON.stringify(contacts));
};

const addContact = (contact) => {
  const contacts = loadContacts();
  contacts.push(contact);
  saveContacts(contacts);
};

/**
 * delete contact in json file
 * @returns {Boolean}
 */
const deleteContact = (name) => {
  const contacts = loadContacts();
  const filteredContacts = contacts.filter(
    (contact) => contact.name.toLowerCase() !== name.toLowerCase()
  );
  saveContacts(filteredContacts);
  return filteredContacts.length !== contacts.length ? true : false;
};

const updateContacts = (newContact) => {
  const contacts = loadContacts();
  const i = contacts.findIndex(
    (contact) =>
      contact.name == newContact.oldName || contact.name == newContact.name
  );
  console.log(i);
  delete newContact.oldName;
  contacts[i] = newContact;
  saveContacts(contacts);
  return i != -1 ? true : false;
};

/**
 * Check for duplicate contacts in json file
 * @returns {Boolean}
 */
const checkForDuplicate = (name) => {
  const contacts = loadContacts();
  return contacts.find((contact) => contact.name == name);
};

module.exports = {
  loadContacts,
  findContact,
  addContact,
  checkForDuplicate,
  deleteContact,
  updateContacts,
};
