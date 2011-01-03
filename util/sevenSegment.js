// 7 segment display methods -> in extra js file

/*
	1. a single digit
		// data
		g			: g,
		val			: ' ',
		
		// public methods
		setValue	: function (val, activeColor, inactiveColor)
	
	
	2. n-digits display, composed from single digits
	
	SevenSegmentDisplay
		// data
		g				: the SVG group
		val 			: the value
		numDigits		: number of digits
		digits[]		: the digits
		activeColor		: color of active segments
		inactiveColor	: color of active segments, null: inactive segments are hidden
		
		// public methods
		setValue(val)	: sets an integer  value,
						  if value is illegal a '---' pattern is displayed
		
		
		// private methods
		private_createPolygonPointsString : helper to create the points string for a segment polygon
*/

function createSevenSegmentDisplay(numDigits, scale, activeColor, inactiveColor) {

	var g = document.createElementNS(SVG, "g");
	var digits = new Array(numDigits);

	for (var i=0; i<numDigits; i++) {
		var digit = createSevenSegmentDigit(scale);
		// g.appendChild(digit);
		g.appendChild(digit.g);
		var tfs = "translate(" + scale*i*0.8 + ", 0)";
		digit.g.setAttribute("transform", tfs);
		digits[i] = digit;
	}

	var ret = {
		g			: g,
		val 		: 0,
		numDigits	: numDigits,
		digits		: digits,
		activeColor	: activeColor,
		inactiveColor : inactiveColor,
		setValue	: function (val) { private_SevenSegmentDisplaySetValue(this, val) }
	}
	
	return ret;
}

function createSevenSegmentDigit(scale) {

	// points are in interval [(0,0),(10,18)]
	// a scale of one should result in [(0,0),(0.xx,1.0)]
	var scale = scale / 18.0;

	var g = document.createElementNS(SVG, "g");
	g.setAttribute("style", "fill-rule:evenodd");
	g.setAttribute("fill", "#888");

	var inputStrings = [
		" 1, 1,  2, 0,  8, 0,  9, 1,  8, 2,  2, 2",
		" 9, 1, 10, 2, 10, 8,  9, 9,  8, 8,  8, 2",
		" 9, 9, 10,10, 10,16,  9,17,  8,16,  8,10",
		" 9,17,  8,18,  2,18,  1,17,  2,16,  8,16",
		" 1,17,  0,16,  0,10,  1, 9,  2,10,  2,16",
		" 1, 9,  0, 8,  0, 2,  1, 1,  2, 2,  2, 8",
		" 1, 9,  2, 8,  8, 8,  9, 9,  8,10,  2,10"
	];
	
	for (var i=0; i<7; i++) {
		var polygon = document.createElementNS(SVG, "polygon");
		polygon.setAttribute("id", i);
		var pps = private_createPolygonPointsString(inputStrings[i], scale);
		polygon.setAttribute("points", pps);
		polygon.setAttribute("fill", "#888");
		g.appendChild(polygon);
	}
	
	ret = {
		g			: g,
		val			: ' ',
		setValue	: function (val, activeColor, inactiveColor) { private_SevenSegmentSet(this, val, activeColor, inactiveColor) }
	};
	
	return ret;
}


function private_createPolygonPointsString(inPoints, scale) {
	var outPoints = "";
	var strs = inPoints.split(",");
	if (12 != strs.length) {
		window.console.info("ERROR");
		return null;
	}
	
	for (var i=0; i<12; i++) {
		var val = parseFloat(strs[i]);
		val *= scale;
		outPoints += val + " ";
	}
	
	return outPoints;
}

function private_SevenSegmentDisplaySetValue(disp, inVal) {

	disp.val = parseInt(inVal);
	// disp.val contains the value set, no matter if it can be displayed
	// if parseInt fails, disp.val contains Number.NaN
	var s,l;
	if (isNaN(disp.val)) {
		s = "";
		l = disp.numDigits;
		for (var i=0; i<disp.numDigits; i++) {
			s += "-";
		}
	}
	else {
		s = ""+disp.val;
		l = s.length;
		if (l>disp.numDigits) {
			s = "";
			l = disp.numDigits;
			for (var i=0; i<disp.numDigits; i++) {
				s += "-";
			}
		}
	}
	
	var start = disp.numDigits-l;
	for (var i=0; i<start; i++) {
		var digit = disp.digits[i];
		digit.setValue(' ', disp.activeColor, disp.inactiveColor);
	}
	for (var i=0; i<l; i++) {
		var c = s.charAt(i);
		var digit = disp.digits[start+i];
		digit.setValue(c, disp.activeColor, disp.inactiveColor);
	}
}

function private_SevenSegmentSet(g, c, activeColor, inactiveColor) {

	// deactive all:
	if (null == inactiveColor) {
		for (var i=0; i<7; i++) {
			g.g.childNodes.item(i).setAttribute("visibility", "hidden");
		}
	}
	else {
		for (var i=0; i<7; i++) {
			g.g.childNodes.item(i).setAttribute("fill", inactiveColor);
		}
	}
	/*
	0 hor, top
	1 vert, right, top
	2 vert, right, bottom
	3 hor, bottom
	4 vert, left, bottom
	5 vert, left, top
	6 hor, mid
	*/
	var activate;
	switch (c) {
	case '0':
		activate = [0,1,2,3,4,5];
		break;
	case '1':
		activate = [1,2];
		break;
	case '2':
		activate = [0,1,3,4,6];
		break;
	case '3':
		activate = [0,1,2,3,6];
		break;
	case '4':
		activate = [1,2,5,6];
		break;
	case '5':
		activate = [0,2,3,5,6];
		break;
	case '6':
		activate = [0,2,3,4,5,6];
		break;
	case '7':
		activate = [0,1,2];
		break;
	case '8':
		activate = [0,1,2,3,4,5,6];
		break;
	case '9':
		activate = [0,1,2,3,5,6];
		break;
	case ' ':
		activate = [];
		break;
	case '-':
		activate = [6];
		break;
	}
	
	if (null == inactiveColor) {
		for (var i=0; i<activate.length; i++) {
			var idx = activate[i];
			g.g.childNodes.item(idx).setAttribute("visibility", "visible");
			g.g.childNodes.item(idx).setAttribute("fill", activeColor);
		}
	}
	else {
		for (var i=0; i<activate.length; i++) {
			var idx = activate[i];
			g.g.childNodes.item(idx).setAttribute("fill", activeColor);
		}
	}
}

