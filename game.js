import { db } from "./supabase.js";

const OFFLINE_MSG = "leaderboard offline: Supabase is not configured (see .env.example)";

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

// --- leaderboard state ---
let startTime = null;
let commandCount = 0;
let finalSeconds = 0;
let awaitingName = false;

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

function pathText() {                   // e.g. "/home/notes", or "/" at the root
  return "/" + cwd.join("/");
}

function promptText() {
  promptEl.textContent = pathText() + " >";
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
  if (cwd.length > 0) cwd.pop();          // allow going up to the root "/"
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

  finalSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
  print("");
  print(`time: ${finalSeconds}s   commands: ${commandCount}`, "flag");
  print("enter your name for the leaderboard:");
  awaitingName = true;
}

function cmdHelp() {
  print("ls            list files");
  print("cd <dir>      enter a directory");
  print("cd ..         go up");
  print("cat <file>    read a file");
  print("unlock        open the vault (needs key + code)");
  print("scores        show the leaderboard");
  print("clear         clear the screen");
  print("");
  print("tab           complete a command or filename");
  print("up / down     walk through your command history");
}

// --- leaderboard (Supabase) ---
async function saveScore(name) {
  print("> " + name, "input");
  if (!db) return print(OFFLINE_MSG, "error");
  const { error } = await db.from("scores").insert({
    name: name.slice(0, 20),
    seconds: finalSeconds,
    commands: commandCount
  });
  if (error) return print("could not save score: " + error.message, "error");
  print("score saved! type 'scores' to see the leaderboard.", "flag");
}

async function cmdScores() {
  if (!db) return print(OFFLINE_MSG, "error");
  print("loading...");
  const { data, error } = await db
    .from("scores")
    .select("name, seconds, commands")
    .order("seconds", { ascending: true })
    .limit(10);
  if (error) return print("scores: " + error.message, "error");
  if (!data.length) return print("leaderboard is empty.");
  data.forEach((r, i) =>
    print(`${String(i + 1).padStart(2)}. ${r.name.padEnd(20)} ${r.seconds}s   ${r.commands} cmds`)
  );
}

// --- dispatch ---
function run(raw) {
  print(pathText() + " >" + raw, "input");
  const [name, arg] = raw.split(/\s+/);
  if (name === "ls")         cmdLs();
  else if (name === "cd")    { arg === ".." ? cmdCdUp() : cmdCd(arg); }
  else if (name === "cat")   cmdCat(arg);
  else if (name === "unlock")cmdUnlock();
  else if (name === "help")  cmdHelp();
  else if (name === "scores") cmdScores();
  else if (name === "clear") screenEl.innerHTML = "";
  else print("unknown command: " + name, "error");
}

// --- command list for tab-completion ---
const COMMANDS = ["ls", "cd", "cat", "unlock", "scores", "help", "clear"];

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
      if (awaitingName) {             // the line after unlocking is the player's name
        awaitingName = false;
        saveScore(raw);
        return;
      }
      if (!startTime) startTime = Date.now();
      commandCount++;
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