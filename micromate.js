var weatherIcons = {
	2: Buffer.from("110A040A11", "hex"), //Thunder
	3: Buffer.from("150A111015", "hex"), //Drizzle
	5: Buffer.from("1B12040D0B", "hex"), //Rain
	6: Buffer.from("1E0D1B0E15", "hex"), //Snow
	7: Buffer.from("150A00150A", "hex"), //Atmosphere
	8: Buffer.from("150E1F0E15", "hex"), //Clear
	9: Buffer.from("000C0E1F1F", "hex"), //Clouds
}

var icons = {
	plus: Buffer.from("04041F0404", "hex"),
	minus: Buffer.from("00001F0000", "hex"),
	unchanged: Buffer.from("000A150000", "hex")
};

var config = require("./config.json");
var express = require("express");
var microbit = require("bbc-microbit");
var weather = require('openweather-apis');
var stocks = require("yahoo-stocks").lookup;
var request = require("request");
var lastCo = "nothing";
var lastPrice = 0;
var startingPrice = 0;
weather.setAPPID(config.owmKey);
weather.setUnits(config.weatherUnits);
var mode = true;
var serverRunning = false;
var running = "none";
var mb = null;
var interval = null;
var timeout = [];
var curTarget = "None";

app = express();
app.use("/action", express.json());
app.post("/action", (req, res) => {
	console.log("Request recieved for intent: " + req.body.queryResult.intent.displayName);
	console.log("Query: " + req.body.queryResult.queryText);
	var intent = req.body.queryResult.intent.displayName;
	var params = req.body.queryResult.parameters;
	if (config.useDiscordWebhook) {
		request.post(config.webhookURL, { 
			form: {
				content: "Request recieved for intent: " + req.body.queryResult.intent.displayName + "\nQuery: " + req.body.queryResult.queryText
			}
		}, function (error, response) {
			if (error) {
				console.log("Error: Cannot contact Discord Webhook");
			}
		});
	}
	mode = true;
	running = "none";
	curTarget = "None";
	clearInterval(interval);
	timeout.forEach((e) => {
		clearTimeout(e);
	});
	if (intent == "Clear Screen") {
		mb.writeLedMatrixState(Buffer.from("0000000000", "hex"));
		res.json({
			fulfillmentText: "Ok, Clearing the screen."
		});
	}
	if (intent == "Show Time") {
		running = "time";
		showTime();
		res.json({
			fulfillmentText: "Ok, Showing the time."
		});
		interval = setInterval(showTime, 7000);
	}
	if (intent == "Show Date") {
		running = "date";
		showDate();
		res.json({
			fulfillmentText: "Ok, Showing the date."
		});
		interval = setInterval(showDate, 7000);
	}
	if (intent == "Show Weather") {
		running = "weather";
		res.json({
			fulfillmentText: "Ok, Showing the weather in " + params.location + "."
		});
		curTarget = params.location;
		weather.setCity(curTarget);
		showWeather();
	}
	if (intent == "Show Message") {
		if (params.message.length <= 20) {
			running = "message";
			res.json({
				fulfillmentText: "Ok, Showing the message \"" + params.message + "\""
			});
			curTarget = params.message;
			mb.writeLedText(curTarget);
			interval = setInterval(() => mb.writeLedText(curTarget), curTarget.length * 1000 + 1000);
		} else {
			res.json({
				fulfillmentText: "Oops, the message was too large. It needs to be less than 20 characters."
			});
			console.log("Error: The message was too large.");
		}
	}
	if (intent == "Show Stocks") {
		params.company = params.company.trim().toUpperCase();
		if (params.company.indexOf(" ") != -1) {
			var words = params.company.split(" ");
			params.company = words[words.length - 1];
		}
		curTarget = params.conpany;
		stocks(curTarget).then(() => {
			res.json({
				fulfillmentText: "Ok, Showing stocks for " + params.company + "."
			});
			showStocks(curTarget);
		}).catch((error) => {
			running = "stocks";
			res.json({
				fulfillmentText: "Oops, We couldn't find that company."
			});
		});
	}
});

app.use("/app", express.json());
app.post("/app", (req, res) => {
	if (req.body.action == "action") {
		res.json({
			code: 200,
			action: running,
			target: curTarget
		});
	}
});

console.log("Looking for Micro:bit...");
microbit.discover(onDiscover);

function showStocks(company) {
	if (running != "stocks") return;
	stocks(company).then((result) => {
		if (lastCo != company) {
			lastCo = company;
			startingPrice = result.currentPrice;
		}
		var change = result.currentPrice - startingPrice;
		var icon = icons.unchanged;
		var percentage = 0;
		if (change > 0) {
			percentage = change / startingPrice * 100;
		} else if (change < 0) {
			percentage = (startingPrice - result.currentPrice) / startingPrice * 100;
		} else {
			percentage = 0;
		}

		change = result.currentPrice - lastPrice;
		if (change > 0) {
			icon = icons.plus;
		} else if (change < 0) {
			icon = icons.minus;
		}
		if (mode) {
			mode = !mode;
			var str = Math.round(percentage * 100) / 100 + "%  $" + result.currentPrice;
			mb.writeLedText(str, () => {
				timeout.push(setTimeout(() => showStocks(company), str.length * 1000));
			});
		} else {
			mode = !mode;
			mb.writeLedMatrixState(icon, () => {
				timeout.push(setTimeout(() => showStocks(company), 4000));
			});
		}
		lastPrice = result.currentPrice;
	}).catch((error) => {
		console.log("Error: Stocks couldn't be retrieved.");
		console.log(error);
		timeout.push(setTimeout(() => showStocks(company), 5000));
	});
}

function showTime() {
	if (running != "time") return;
	var date = new Date(new Date().getTime() + config.timezone * 1000 * 60 * 60);
	mb.writeLedText(date.toLocaleString('en-US', {
		hour: 'numeric',
		minute: 'numeric',
		hour12: config.time12h
	}));
}

function showDate() {
	if (running != "date") return;
	var date = new Date(new Date().getTime() + config.timezone * 1000 * 60 * 60);
	mb.writeLedText(date.getMonth() + "/" + date.getDay() + "/" + date.getFullYear());
}

function showWeather() {
	if (running != "weather") return;
	weather.getAllWeather(function (error, result) {
		if (error) {
			console.log("Error: Weather couldn't be retrieved.");
			timeout.push(setTimeout(() => showWeather(), 5000));
			return;
		}
		var id = Math.floor(result.weather[0].id / 100);
		if (id == 8) {
			if (result.weather[0].id != 800) {
				id = 9;
			}
		}
		if (mode) {
			mode = !mode;
			mb.writeLedText("" + Math.round(result.main.temp), () => {
				timeout.push(setTimeout(() => showWeather(), 3000));
			});
		} else {
			mode = !mode;
			mb.writeLedMatrixState(weatherIcons[id], () => {
				timeout.push(setTimeout(() => showWeather(), 3000));
			});
		}
	});
}

function onDisconnect() {
	console.log("Error: Disconnected. Retrying...");
	setTimeout(() => microbit.discover(onDiscover), 2000);
}

function onConnect() {
	console.log("Connected. Starting Server...");
	mb.writeLedText("Micro:mate", () => console.log("Test message sent."));
	if (!serverRunning) {
		serverRunning = true;
		app.listen(80, () => console.log("Server started on port 80."));
	}
}

function onDiscover(bbcmb) {
	mb = bbcmb;
	mb.on("disconnect", onDisconnect);
	console.log("Discovered a Micro:bit. Connecting...");
	mb.connectAndSetUp(onConnect);
}