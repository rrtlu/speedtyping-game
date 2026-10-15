// --- the filesystem: nested objects. "file" holds text, "dir" holds children ---
const fs = {
  home: {
    "readme.txt": "the vault is somewhere in this tree. it needs a key and a code.",
    notes: {
      "todo.txt": "1. find the vault   2. find the key   3. find the code"
    }
  },
  var: {
    log: {
      "auth.log": "user guest logged in\nuser guest denied: /var/vault",
    },
    vault: {
      "READ_ME": "type 'unlock' when you have both halves.",
      "secret": "VAULT SEALED - need key + code"
    }
  },
  etc: {
    config: {
      "keys.txt": "KEY = blue-otter-77",
      "codes.txt": "CODE = 0815"
    }
  }
};

const FLAG = "FLAG{y0u_cr4ck3d_th3_s1mpl3_b0x}";

// --- state ---
let cwd = ["home"];
const screenEl = document.getElementById("screen");
const cmdEl = document.getElementById("cmd");
const promptEl = document.getElementById("prompt");

let hasKey = false, hasCode = false, unlocked = false;

// --- helpers ---
function print(text, cls) {
  const line = document.createElement("span");
  line.className = cls || "";
  line.textContent = text + "\n";
  screenEl.appendChild(line);
  screenEl.scrollTop = screenEl.scrollHeight;
}

function here() {                       // the object at the current path
  let node = fs;
  for (const part of cwd) node = node[part];
  return node;
}

function promptText() {
  promptEl.textContent = cwd.join("/") + " >";
}

// --- commands ---
function cmdLs() {
  const names = Object.keys(here());
  if (!names.length) return print("(empty)");
  print(names.join("   "));
}

function cmdCd(arg) {
  if (!arg) { cwd = ["home"]; promptText(); return; }
  const node = here()[arg];
  if (!node) return print("cd: no such directory: " + arg, "error");
  if (typeof node === "string") return print("cd: not a directory: " + arg, "error");
  cwd.push(arg);
  promptText();
}

function cmdCat(arg) {
  if (!arg) return print("cat: which file?", "error");
  const node = here()[arg];
  if (node === undefined) return print("cat: no such file: " + arg, "error");
  if (typeof node !== "string") return print("cat: that is a directory", "error");
  print(node);

  // picking up the two halves
  if (node.includes("blue-otter-77")) { hasKey = true; print(">> key acquired", "flag"); }
  if (node.includes("0815"))          { hasCode = true; print(">> code acquired", "flag"); }
}

function cmdCdUp() {
  if (cwd.length > 1) cwd.pop();
  promptText();
}

function cmdUnlock() {
  if (unlocked) return print("the vault is already open.", "flag");
  if (!hasKey)  return print("unlock: you have no key.", "error");
  if (!hasCode) return print("unlock: you have no code.", "error");
  unlocked = true;
  print("key accepted.");
  print("code accepted.");
  print("opening /var/vault/secret ...");
  print(FLAG, "flag");
}

function cmdHelp() {
  print("ls            list files");
  print("cd <dir>      enter a directory");
  print("cd ..         go up");
  print("cat <file>    read a file");
  print("unlock        open the vault (needs key + code)");
  print("clear         clear the screen");
  print("");
  print("tab           complete a command or filename");
  print("up / down     walk through your command history");
}

// --- dispatch ---
function run(raw) {
  print(cwd.join("/") + " >" + raw, "input");
  const [name, arg] = raw.split(/\s+/);
  if (name === "ls")         cmdLs();
  else if (name === "cd")    { arg === ".." ? cmdCdUp() : cmdCd(arg); }
  else if (name === "cat")   cmdCat(arg);
  else if (name === "unlock")cmdUnlock();
  else if (name === "help")  cmdHelp();
  else if (name === "clear") screenEl.innerHTML = "";
  else print("unknown command: " + name, "error");
}

// --- command list for tab-completion ---
const COMMANDS = ["ls", "cd", "cat", "unlock", "help", "clear"];

// completes the word under the cursor: commands if it's the first word,
// filenames from the current directory otherwise.
function complete() {
  const value = cmdEl.value;
  const parts = value.split(/\s+/);
  const isFirstWord = parts.length === 1;
  const stem = parts[parts.length - 1];

  const options = isFirstWord ? COMMANDS : Object.keys(here());
  const hits = options.filter(o => o.startsWith(stem));

  if (!hits.length) return;
  if (hits.length > 1) {                 // show the choices, complete what's common
    print(hits.join("   "), "input");
    return;
  }
  parts[parts.length - 1] = hits[0];
  cmdEl.value = parts.join(" ") + (isFirstWord ? " " : "");
}

// --- command history ---
const history = [];
let histPos = 0;        // 0 = the line being typed; 1 = most recent command

// --- main loop ---
cmdEl.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const raw = cmdEl.value.trim();
    cmdEl.value = "";
    if (raw) {
      history.push(raw);
      histPos = 0;
      run(raw);
    }
  } else if (e.key === "Tab") {
    e.preventDefault();
    complete();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (histPos < history.length) {
      histPos++;
      cmdEl.value = history[history.length - histPos];
    }
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (histPos > 1) {
      histPos--;
      cmdEl.value = history[history.length - histPos];
    } else {
      histPos = 0;
      cmdEl.value = "";
    }
  }
});

document.addEventListener("click", () => cmdEl.focus());

print("TERMINAL v0.1");
print("find the vault, find the key, find the code.");
print("type 'help' if you are stuck.");
print("");
promptText();
cmdEl.focus();
