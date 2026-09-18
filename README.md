# 💩 Shitter AI

Free AI-powered screen assistant. Press a hotkey, get instant AI analysis of anything on your screen. **Completely invisible during screen sharing** - Zoom, Teams, Meet, OBS, none of them can see it.

Works with **Gemini (free)** or **Claude (paid)** - your choice.

---

## Setup (5 minutes, totally free)

### Step 1: Install Node.js

Go to [nodejs.org](https://nodejs.org) and download **v22 LTS** (not the "Current" version).

Run the installer, click Next through everything, done.

### Step 2: Get the app

Open **PowerShell** (Windows) or **Terminal** (Mac/Linux) and run:

```
git clone https://github.com/spencxrr/shitter-ai.git
cd shitter-ai
npm install
```

The install takes a minute since Electron is a big download. Let it finish.

### Step 3: Get a free API key

Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and sign in with your Google account.

Click **Create API Key**. Copy it.

That's it. No credit card. No payment. Completely free.

> **Note:** Google requires your account to have age verification (18+). If it redirects you to an "available regions" page, go to [myaccount.google.com](https://myaccount.google.com) > Personal info and confirm your birthday first.

### Step 4: Run the app

```
npm start
```

The app opens. The settings panel pops up automatically. Paste your Gemini API key, hit **Save**, and you're good.

### Step 5: Use it

Press **Ctrl+Shift+S** from anywhere on your computer. It screenshots your screen, sends it to AI, and gives you an answer. That's the whole thing.

---

## Features

- **Invisible during screen sharing** - the app window doesn't show up in Zoom, Teams, Meet, or any screen recording
- **Global hotkey** - Ctrl+Shift+S works from anywhere, even when the app is in the background
- **Always on top** - stays visible over other windows
- **Dual AI providers** - switch between Gemini (free) and Claude (paid) in settings
- **Custom prompts** - presets for general use, quiz help, code review, explanations, and code roasting
- **Follow-up questions** - ask follow-ups about what you just snapped
- **Chat history** - keeps context within your session

## Provider comparison

| | Gemini | Claude |
|---|---|---|
| **Cost** | Free | ~$0.01-0.03 per snap |
| **API key** | Free at aistudio.google.com | $5 minimum at console.anthropic.com |
| **Best model** | Gemini 2.5 Flash | Claude Sonnet 5 |
| **Speed** | Fast | Fast |
| **Quality** | Great | Great |

For most people, Gemini is the move. It's free and it's good.

---

## Running it again later

Every time you want to use it, open PowerShell/Terminal and run:

```
cd shitter-ai
npm start
```

That's it. Two commands.

---

## Optional: Claude setup

If you want to use Claude instead of (or alongside) Gemini:

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account and buy $5 in credits
3. Go to API Keys > Create Key
4. In the app settings, switch to Claude and paste the key

You can switch between providers anytime.

---

## Troubleshooting

**"Electron failed to install correctly"**
Your Node.js version is too new. Uninstall it, then install Node v22 LTS from [nodejs.org](https://nodejs.org).

**"Invalid API key"**
Make sure you copied the full key with no spaces before or after it. If it still doesn't work, delete the key and create a new one.

**Google AI Studio says "available regions"**
Your Google account age isn't verified. Go to [myaccount.google.com](https://myaccount.google.com) > Personal info > Birthday and confirm your age.

**The app doesn't open when I click the icon**
You can't launch it by clicking an icon. You have to run `npm start` from the terminal inside the shitter-ai folder.

---

## Don't have Git?

If `git clone` doesn't work, install Git from [git-scm.com](https://git-scm.com) first.

Or click the green **Code** button on this GitHub page, click **Download ZIP**, extract it, and `cd` into the folder instead.

---

v1.2 | made by [@spencxrr](https://github.com/spencxrr)
