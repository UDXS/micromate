# UDXS Micro:mate

Who needs a $200 smart display when you have a micro:bit and a Pi lying aound?

## Setup
---
### 1. Installing Node

First, we have to install NVM with this command:

`curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh | bash`

Then, we must install Node and NPM through NVM:

`nvm install 8`

Then, we update NPM:

`npm install -g npm`

Finally, we have to allow Node to work with `sudo`:

```bash
n=$(which node); \
n=${n%/bin/node}; \
chmod -R 755 $n/bin/*; \
sudo cp -r $n/{bin,lib,share} /usr/local
```

(Credit: [DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-with-nvm-node-version-manager-on-a-vps#-installing-nodejs-on-a-vps). Found from [StackOverflow](https://stackoverflow.com/a/29903645).)

### 2. Installing Micro:mate

First, we need to install all dependencies to the Pi:
```bash
sudo apt install git bluetooth bluez libbluetooth-dev libudev-dev
```

We then need to link `node` to the command `nodejs` for Noble to work correctly
Do it with this command:
```bash
sudo ln -s /usr/bin/nodejs /usr/bin/node
```

Then, we can go ahead and get Micro:mate onto the Pi.
We can do that with the following commands:
```bash
#Download the Repo
git clone https://github.com/UDXS/micromate.git
#Go into it
cd micromate
#Install all the dependencies from NPM
sudo npm install
```
Next, we have to configure Micro:mate.
To do this, open up `config.json` and follow the instructions.
[You can get an OpenWeatherMap key here.](https://openweathermap.org/appid)
The rest will be configured later in the Dialogflow console.

### 3. Setting up the server

Before we can run anything, we need to set up Dataplicity.
This is done because Dialogflow expects an HTTPS connection.
Dataplicity allows us to remotely access the Pi from anywhere as well as tunnel HTTP (Port 80) traffic to a
Dataplicity URL. This tunnel also converts HTTP to HTTPS.
The best part is that this is all free
(though you can pay to tunnel other ports).

To do this, go to the [Dataplicity website](https://www.dataplicity.com/)
and sign up. Then, follow the instructions to
copy the code to the Pi's terminal.
You should then be able to view your devices.
Select the Pi and open the terminal.
Ensure the sidebar is open and then enable Wormhole.
You should see a `dataplicity.io` link.

Follow [this tutorial](https://docs.dataplicity.com/docs/superuser)
from Dataplicity to get into your `pi` account
and then [this one](https://docs.dataplicity.com/docs/run-your-scripts-in-background)
to run the server without Dataplicity open.

**Note:** You will no longer be able to run web servers on port 80

At this point, copy `node-bbc-microbit-v0.1.0.hex` to the Micro:bit.
After it is done uploading, it should ask you to do the compass
calibration. Go ahead and complete it. 

If it freezes, ensure the server isn't running yet, as it can
corrupt the process.

At this point, you can start the server by typing:
```bash
sudo node micromate.js
```

**If all goes well, you should see the text `Micro:mate` scrolling
on the Micro:bit.**


If it says `Test Message Sent.` but you see no message on the display, type the following command to fix it:
```bash
sudo hciconfig reset hci0
```
and then restart the server.

### 3. Setting up Dialogflow

At this point, our server is running but it has no way to
receive and process commands. To do this, we need to set up
Dialogflow.

First, you need to go to [the Dialogflow website](https://dialogflow.com/)
and sign in with your Google Account by clicking
`Go To Console`. Once you logged in, you will likely
be given a tutorial and shown around the console.
It will give you a demo agent where you are free
to poke around and understand how Dialogflow works.

Click on the list below the Dialogflow logo where
it shows the current project name and select `Create New Agent`.

Name it `Micro:mate` and select your time zone. Then, click create. You should be brought into an empty project. Again at the top-left, click on the gear icon next to your project.

Then, click on `Export and Import`. Here, select `Restore From ZIP`. Select `Micromate.zip` from the `micromate` folder.

At this stage, we have to configure the default city for weather.
Select `Intents` in the sidebar and click on `Show Weather`.
Scroll down to `Action and parameters` and where it shows the
`location` parameter, select `⋮`. Then, click on `Default Value`.
Here, you can type in your city of residence.

When you are done, click `Save` at the top right.

Next, we must tell Dialogflow to use our server.
To do this, click on `Fulfillment` on the sidebar.
Where it says URL, type
`<YOUR DATAPLICITY URL>.dataplicity.io/action`
replacing it with your unique URL.
**Make sure you have `/action` at the end.**
Then, scroll down to the very bottom and click `Save`.

### 4. Talking to the Google Assistant

Next, we need to allow Dialogflow to work with the Google Assistant.
Start by clicking `Integrations` on the sidebar.
Then, click on Google Assistant. Here, we have settings
for the Assistant. Everything should already be set up.
All you have to do is scroll down to `Auto-preview changes`
and enable it. Then, click `Test` at the bottom
of the dialog box.

At this point, you should be in the simulator but
it isn't properly set up yet.

First, go to `Invocation` on the sidebar and give it a name. Unfortunately, you cannot name it `Micro mate` like I did.
 Then, if you'd like, you can change the voice.
When done, click `Save`.

Then, go back to the `Simulator` and test it by saying `Talk to <Name>` and then one of the intent phrases such as `Show the weather` and see if it works. Also try doing the shorthand commands. These look like `Ask <Name> to show the time`.

If these commands work and show up on your Pi
and on your Micro:bit, that means it is working correctly.

Before we can deploy the app to a phone, we need to fill in
the correct info. Go to the `Overview` page on the sidebar
and see what it needs you to do. If it asks for a logo, I
recommend the Micro:bit logo.

When this is all done, go to the `Release` page in the sidebar
and click `Submit For Alpha`. This may take a while to work.
Once it does work, though, and it shows the release as `Deployed`,
click on `Manage Alpha Testers`. Copy the Opt-in link to your phone and, when asked where to open it, select Google Assistant.
It should then be added. You should be able to use any command
you want like you did in the simulator.

You can see all the possible commands by looking at
the list of intents in Dialogflow.

## Thanks for following! 
---
If you liked it, please consider [donating!](https://www.paypal.me/udxs) I'm on twitter as [@UDXSDavid](https://twitter.com/UDXSDavid). Also check out my site [UDXS.me](https://udxs.me/).