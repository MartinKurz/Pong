var SVG = "http://www.w3.org/2000/svg";
var XLINK = "http://www.w3.org/1999/xlink";
var XHTML = "http://www.w3.org/1999/xhtml";

// var svg = document.rootElement;
var svg = document.getElementById("svg");
var defs = document.createElementNS(SVG, "defs");
svg.appendChild(defs);

var viewBox = svg.getAttribute("viewBox");
var t = viewBox.split(" ");
var screenX = parseInt(t[0]);
var screenY = parseInt(t[1]);
var screenWidth = parseInt(t[2]);
var screenHeight = parseInt(t[3]);
var borderWidth = screenWidth/80;
var racketWidth = borderWidth*1.5;
var racketHeight = screenWidth / 9;
var ballSize = borderWidth*2;
var racketX = screenWidth/2 - borderWidth- 2*racketWidth;

var vStart = 15;
var deltaV = 1.0005;
var attenuation = 0.97;

var updateTimer = null;

var pointsToWin = 4;

var newGameQuestion = false;

// computer, left side
var playerOne = {
	name	:	"I",
	points	:	0,
	games	:	0,
	sets	:	0,
	xPos	:	0,
	yPos	:	0,
	racket	:	null
}

// user, right side
var playerTwo = {
	name	:	"you",
	points	:	0,
	games	:	0,
	sets	:	0,
	xPos	:	0,
	yPos	:	0,
	racket	:	null
}

var players = [playerOne, playerTwo];

var colorSchemas = [
	{
		foreground : "black",
		background : "white"
	},
	{
		foreground : "white",
		background : "black"
	}
];

var currentSchema;

// components;
var background;
var field;
var fieldBorder;
var midLine;
var ball;
var ballX, ballY;
var ballVX, ballVY;
var dt = 1.0;

var KEY_UP = 38;
var KEY_DOWN = 40;
var deltaY = 30;

var interactionMethod = "Mouse";
// var interactionMethod = "Keyboard";


var SOUND = {
	BING	: 0,
	WALL	: 1,
	RACKET	: 2,
	
	names	:
	[
		"sounds/ping_1000.ogg",
		"sounds/woosh.ogg",
		"sounds/racket.ogg"
	],
	numSounds : 4,
	numOccurances : 4
};
SOUND.sounds = new Array(SOUND.numSounds);
for (var i=0; i<SOUND.numSounds; i++) {
	SOUND.sounds[i] = new Array(SOUND.numOccurances);
}

function createAudio() {
	var body = document.getElementById("body");

	for (var j=0; j<SOUND.numSounds; j++) {
		for (var i=0; i<SOUND.numOccurances; i++) {
			SOUND.sounds[j][i] = document.createElementNS(XHTML, "audio");
			SOUND.sounds[j][i].setAttribute("src", SOUND.names[j]);
			body.appendChild(SOUND.sounds[j][i]);
		}
	}
}

function play(idx) {

	var sound0 = SOUND.sounds[idx][0];
	var sound1 = SOUND.sounds[idx][1];
	
	var playing0 = sound0.currentTime != 0 && sound0.currentTime < sound0.duration;
	var playing1 = sound1.currentTime != 0 && sound1.currentTime < sound1.duration;

	if (playing0) {
		sound1.currentTime=0;
		sound1.play();
	}
	else {
		sound0.currentTime=0;
		sound0.play();
	}
}

/*
ok, but limited
function createAudio() {
	var body = document.getElementById("body");

	var audio = new Array(2);
	
	audio[0] = document.createElementNS(XHTML, "audio");
	audio[0].setAttribute("id", "bing0");
	audio[0].setAttribute("src", "ping_1000.ogg");
	body.appendChild(audio[0]);
	
	audio[1] = document.createElementNS(XHTML, "audio");
	audio[1].setAttribute("id", "bing1");
	audio[1].setAttribute("src", "ping_1000.ogg");
	body.appendChild(audio[1]);
}

function bing() {
	play('bing');
}

function play(tag) {

	var sound0=document.getElementById(tag+"0");
	var sound1=document.getElementById(tag+"1");
	if (!sound0) {
		return;
	}
	if (!sound1) {
		return;
	}
	
	var playing0 = sound0.currentTime != 0 && sound0.currentTime < sound0.duration;
	var playing1 = sound1.currentTime != 0 && sound1.currentTime < sound1.duration;

	if (playing0) {
		sound1.currentTime=0;
		sound1.play();
	}
	else {
		sound0.currentTime=0;
		sound0.play();
	}
}
*/

function play1(tag) {

	var sound=document.getElementById(tag);
	if (!sound) {
		return;
	}

	/*
		sound problems:
		1. set currentTime=0 is not working, if currentTime < ca. 100ms)
		   -> only one sound is played, not the one which should start at t=50ms (for all browsers)
		2. FF needs a minimum duration (more than 100ms)
		
		A wa for problem 1 would be to use shorter sounds, but problem 2 makes this impossible
		
		WA: more than one HTML <sound> for one real sound. If sound[0] is playing -> use sound[1] instead
	*/
	sound.currentTime=0;
	sound.play();
}





function doload() {

	createAudio();
	setBackground();
	var field = createField();
	svg.appendChild(field);
	
	svg.setAttribute("style", "cursor:none");
	
	createRacket(0);
	createRacket(1);
	
	svg.appendChild(players[0].racket);
	svg.appendChild(players[1].racket);

	if (interactionMethod == "Mouse") {
		svg.addEventListener("mousemove", onMouseMove, false);
	}
	else if (interactionMethod == "Keyboard") {
		svg.addEventListener("keydown", onKeyDown, false);
	}

	// pause / restart
	svg.addEventListener("keydown", onKeyDownPauseRestart, false);
	svg.addEventListener("mousedown", onMouseDown, false);
 	
	createBall();
	
	currentSchema = colorSchemas[randomInt(colorSchemas.length)];
	setColorSchema(currentSchema);

	var digitHeight = 200;
	
	var display = createSevenSegmentDisplay(3, digitHeight, currentSchema.foreground, null);
	players[0].display = display;
	svg.appendChild(display.g);
	var xpos = screenX + 2*borderWidth;
	var ypos = screenY + 2*borderWidth;
	display.g.setAttribute("transform", "translate(" + xpos + "," + ypos + ")");
	
	display = createSevenSegmentDisplay(3, digitHeight, currentSchema.foreground, null);
	players[1].display = display;
	svg.appendChild(display.g);
	xpos = screenX + screenWidth - 2*borderWidth - 3*digitHeight;
	ypos = screenY + 2*borderWidth;
	display.g.setAttribute("transform", "translate(" + xpos + "," + ypos + ")");
	
	newGame();
	// alert("doload");
}

function updateBall() {

	updateRacket();
	
	ballX += dt*ballVX;
	ballY += dt*ballVY;
	
	if (Math.abs(ballY) > screenHeight/2) {
		ballY -= dt*ballVY;
		ballVY = -ballVY;
		play(SOUND.WALL);
	}
	
	var isLeft = ballX < 0.0;

	if (Math.abs(ballX) > racketX) {
		var id = ballX < 0 ? 0 : 1;
		var otherId = (id+1)%2;
		var player = players[id];
		var d = ballY - player.yPos;
		if (Math.abs(d) > racketHeight / 2) {
			// window.console.info("OUT");
			pointFor(otherId);
			return;
		}
		var q = d / racketHeight;
		
		// simple reflection:
		ballX -= dt*ballVX;
		ballVX = -ballVX;
		
		// current velocity
		var v = Math.sqrt(ballVX*ballVX + ballVY*ballVY);

		// angle
		var angle = Math.atan(ballVY / ballVX);
		if (!isLeft) {
			angle = angle - Math.PI;
		}
		if (angle < 0) {
			angle += 2*Math.PI;
		}
		
		// angle adjustment, using the hit point
		if (isLeft) {
			angle = angle + q;
		}
		else {
			angle = angle - q;
		}
		
		// angle within [0..PI]
		if (angle < 0) {
			angle += 2*Math.PI;
		}
		if (angle > 2*Math.PI) {
			angle -= 2*Math.PI;
		}
		
		var maxAllowed = 0.7;
		
		// do not allow too extreme angles
		if (isLeft) {
			if (angle > Math.PI) {
				angle -= 2*Math.PI;
			}
			if (angle > maxAllowed) {
				angle = maxAllowed;
			}
			else if (angle < -maxAllowed) {
				angle = -maxAllowed;
			}
		}
		else {
			if (angle - Math.PI > maxAllowed) {
				angle = maxAllowed + Math.PI;
			}
			else if (angle - Math.PI < -maxAllowed) {
				angle = -maxAllowed + Math.PI;
			}
		}
		
		ballVX = v * Math.cos(angle);
		ballVY = v * Math.sin(angle);

		if (isLeft) {
			play(SOUND.RACKET);
		}
		else {
			play(SOUND.RACKET);
		}
	}
	
	ballVX *= deltaV;
	ballVY *= deltaV;
	ball.setAttribute("transform", "translate(" + ballX + "," + ballY + ")");
}

function pauseGame() {
	clearInterval(updateTimer);
	updateTimer = null;
	svg.setAttribute("style", "cursor:auto");
	showMessage(["space bar", "or mouseclick", "to continue"]);
}

// var playCursor = null;

function restartGame() {
	svg.setAttribute("style", "cursor:none");

	// svg.setAttribute("style", "cursor: url('cursor2.ico'), text");
	
	/*
	if (null == playCursor) {
		playCursor = document.createElementNS(SVG, "cursor");
		playCursor.setAttribute("url", "cursor1.png");
	}
	*/
	
	
	if (!updateTimer) {
		updateTimer = setInterval(updateBall, 10);
	}
	hideMessage();
}

function pointFor(id) {

	// pauseGame();

	var player = players[id];
	var otherPlayer = players[(id+1)%2];
	
	player.points++;
	showPoints(id);
	
	if (player.points == pointsToWin) {
		gameWon(id);
	}
	else {
		play(SOUND.BING);
		newBall(id);
	}
}

function gameWon(id) {
	pauseGame();
	// showMessage(["game won by ", players[id].name]);
	// showMessage("game won by " + players[id].name);
	showMessage(players[id].name + " win");
	play(SOUND.BING);
	// newGame();
	newGameQuestion = true;
}

var messagePanel = null;

var maxLines = 7;
function showMessage(msg) {

	var messages;
	if (msg instanceof Array) {
		messages = msg;
	}
	else {
		messages = [msg];
	}

	if (null == messagePanel) {
		createMessagePanel();
	}

	// hide all text elements
	for (var i=0; i<maxLines; i++) {
		messagePanel.t[i].setAttribute("visibility", "hidden");
	}
	
	var n = messages.length;
	
	for (var i=0; i<n; i++) {
		messagePanel.tp[i].textContent = messages[i];
		messagePanel.t[i].setAttribute("visibility", "visible");
		messagePanel.tp[i].setAttributeNS(XLINK, "xlink:href", "#" + pathId(n,i));
	}

	messagePanel.g.setAttribute("display", "inline");
}

function createMessagePanel() {
	messagePanel = new Object();
	messagePanel.g = document.createElementNS(SVG, "g");
	
	var r = document.createElementNS(SVG, "rect");
	messagePanel.g.appendChild(r);
	var scale = 0.7;
	r.setAttribute("x", screenX*scale);
	r.setAttribute("y", screenY*scale);
	r.setAttribute("width", screenWidth*scale);
	r.setAttribute("height", screenHeight*scale);
	r.setAttribute("fill", "red");
	r.setAttribute("fill-opacity", "0.7");
	r.setAttribute("stroke", "none");
	
	messagePanel.t = new Array(maxLines);
	messagePanel.tp = new Array(maxLines);
	
	var fontSize = 180;

	for (var i=0; i<maxLines; i++) {
		var t = document.createElementNS(SVG, "text");
		messagePanel.t[i] = t;
		messagePanel.g.appendChild(t);
		t.setAttribute("visibility", "hidden");
		t.setAttribute("fill", currentSchema.foreground);
		t.setAttribute("font-size", fontSize);
		t.setAttribute("font-weight", "bold");
		// t.setAttribute("font-family", "Courier");
		t.setAttribute("font-family", "monospace");
		t.setAttribute("pointer-events", "none");
		
		var tp = document.createElementNS(SVG, "textPath");
		messagePanel.tp[i] = tp;
		t.appendChild(tp);
	}

	var top = screenY*scale;
	var left = screenX*scale + screenWidth * 0.05;
	var right = screenWidth*scale;
	for (var i=1; i<=maxLines; i++) {			// for every number i
		var lineDistance = scale*screenHeight / (i+1);
		for (var j=0; j<i; j++) {				// create i paths
			var path = document.createElementNS(SVG, "path");
			path.setAttribute("id", pathId(i,j));
			var y = top + (j+1)*lineDistance + + fontSize/2;
			var d = "M " + left + " " + y + " L " + right + " " + y;
			path.setAttribute("d", d);
			
			defs.appendChild(path);
		}
	}
		
	svg.appendChild(messagePanel.g);
}

function pathId(numLines, line) {
	return "textPath_" + numLines + "_" + line;
}


function hideMessage() {
	if (null != messagePanel) {
		messagePanel.g.setAttribute("display", "none");
	}
}

function showPoints(id) {
	var player = players[id];
	player.display.setValue(player.points);
}


function newBall(id) {
	// window.console.info("newBall " + id);
	ballX = 0;
	ballY = 0;
	var angle = 0.2*Math.PI*(randomRange(-1, 1));

	if (1 == id) {
		ballX = racketX;
	}
	else {
		ballX = -racketX;
		angle += Math.PI;
	}
	
	ballVX = -vStart*Math.cos(angle);
	ballVY = vStart*Math.sin(angle);
	
	// restartGame();
}

function initPlayer(p) {
	p.points = 0;
	p.sets = 0;
	p.games = 0;
}

function randomInt(max) {
	return parseInt(max*Math.random()+"");
}

function randomBin() {
	return Math.random() < 0.5 ? 0 : 1;
}

function randomYN() {
	return Math.random() < 0.5 ? false : true;
}

function randomRange(low, high) {
	var range = high - low;
	return low + range * Math.random()
}

function newGame() {
	// hideMessage();
	newGameQuestion = false;
	
	newBall(randomBin());
	initPlayer(players[0]);
	initPlayer(players[1]);
	
	showPoints(0);
	showPoints(1);
	
	restartGame();
}

function setColorSchema(currentSchema) {
	var f = [field, midLine, players[1].racket, players[0].racket, ball];
	
	background.setAttribute("fill", currentSchema.background);
	fieldBorder.setAttribute("stroke", currentSchema.foreground);
	for (i=0; i<f.length; i++) {
		f[i].setAttribute("fill", currentSchema.foreground);
	}
}

function setBackground() {

	background = document.createElementNS(SVG, "rect");

//	background.setAttribute("id", "background");
	background.setAttribute("x", screenX*2);
	background.setAttribute("y", screenY*2);
	background.setAttribute("width", screenWidth*2);
	background.setAttribute("height", screenHeight*2);
	background.setAttribute("stroke", "none");
	background.setAttribute("stroke-width", borderWidth);
	svg.appendChild(background);
}

function createField() {
	field = document.createElementNS(SVG, "g");
	field.setAttribute("id", "field");

	fieldBorder = document.createElementNS(SVG, "rect");
	fieldBorder.setAttribute("x", screenX + borderWidth/2);
	fieldBorder.setAttribute("y", screenY + borderWidth/2);
	fieldBorder.setAttribute("width", screenWidth - borderWidth);
	fieldBorder.setAttribute("height", screenHeight - borderWidth);
	fieldBorder.setAttribute("fill", "none");
	fieldBorder.setAttribute("stroke-width", borderWidth);
	field.appendChild(fieldBorder);
	
	midLine = document.createElementNS(SVG, "rect");
	midLine.setAttribute("id", "midLine");
	midLine.setAttribute("x", -borderWidth/2);
	midLine.setAttribute("y", screenY);
	midLine.setAttribute("width", borderWidth);
	midLine.setAttribute("height", screenHeight);
	midLine.setAttribute("stroke", "none");
	field.appendChild(midLine);
	
	return field;
}

function createRacket(id) {

	var racket = document.createElementNS(SVG, "rect");
	var player = players[id];
	player.racket = racket;
	
	racket.setAttribute("y", -racketHeight/2);
	racket.setAttribute("x", -racketWidth/2);
	racket.setAttribute("width", racketWidth);
	racket.setAttribute("height", racketHeight);

	player.xPos = (0 == id) ? -racketX : racketX;
	player.yPos = 0;
	
	racket.setAttribute("transform", "translate(" + player.xPos + ",0)");
}

function createBall(name) {
	ball = document.createElementNS(SVG, "rect");
	ball.setAttribute("y", -ballSize/2);
	ball.setAttribute("x", -ballSize/2);
	ball.setAttribute("width", ballSize);
	ball.setAttribute("height", ballSize);
	
	svg.appendChild(ball);
}

function onKeyDown(evt) {

	if (null == updateTimer) {
		return;
	}
	
	var d = 0;
	switch (evt.keyCode) {
	case KEY_UP:
		d = -deltaY;
		break;
	case KEY_DOWN:
		d = deltaY;
		break;
	}

	if (d != 0) {
		var pos = document.documentElement.createSVGPoint();
		pos.x = 0;
		pos.y = players[1].yPos + d;
		setRacketPosition(1, pos);
	}
}

function togglePause() {

	if (newGameQuestion) {
		newGame();
		return;
	}

	if (updateTimer) {
		pauseGame();
	}
	else {
		restartGame();
	}
}

function onMouseDown(evt) {
	togglePause();
}

function onKeyDownPauseRestart(evt) {

	switch (evt.keyCode) {
	case 32:
		togglePause();
		break;
	}
}

function setRacketPosition(id, pos) {
	var player = players[id];
	player.yPos = pos.y;
	var maxY = screenHeight / 2 - racketHeight/2;
	if (player.yPos > maxY) {
		player.yPos = maxY;
	}
	if (player.yPos < -maxY) {
		player.yPos = -maxY;
	}
	var tfs = "translate(" + player.xPos + "," + player.yPos + ")";
	player.racket.setAttribute("transform", tfs);
}

function onMouseMove(evt) {
	var pos = screenToClient(players[1].racket, evt.clientX, evt.clientY);
	setRacketPosition(1, pos);
	
	// should be done by computer:
	// setRacketPosition(0, pos);
}

var lastY = -10000;
var racketVY = 0;
function updateRacket() {

	var actY = players[0].yPos;

	var dy = ballY - actY + randomRange(-100, 100);
	
	if (dy > racketHeight/2) {
		dy = racketHeight/2;
	}
	else if (dy < -racketHeight/2) {
		dy = -racketHeight/2;
	}
	else {
		dy = 0;
	}
	
	var DT = 0.2;
	
	racketVY += dy*DT;
	actY = actY + racketVY*DT;
	
	racketVY *= attenuation;
	
	var pos = new Object();
	pos.y = actY;
	
	setRacketPosition(0, pos);
}

// better: not all points go to computer:
function updateRacket2() {

	var actY = players[0].yPos;

	var dy = ballY - actY + randomRange(-100, 100);
	
	if (dy > racketHeight/2) {
		dy = racketHeight/2;
	}
	else if (dy < -racketHeight/2) {
		dy = -racketHeight/2;
	}
	else {
		dy = 0;
	}
	
	var pos = new Object();
	pos.y = actY + dy;
	
	setRacketPosition(0, pos);
}

// perfect player:
function updateRacket1() {

	var pos = new Object();
	pos.x = 10;	// not needed
	pos.y = ballY;
	setRacketPosition(0, pos);
}




