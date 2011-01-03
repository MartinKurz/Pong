function getScreenCTM(theElement) {

	if (theElement.getScreenCTM) {
		return theElement.getScreenCTM();
	}
	
	var producer = document.rootElement;
	
	var sCTM = producer.createSVGMatrix();

	var tr = producer.createSVGMatrix();
	var par = theElement.getAttribute("preserveAspectRatio");
	
	if (par==null || par=="") {
		par = "xMidYMid meet";				//setting to default value
	}
	var parX = par.substring(0,4);			//xMin;xMid;xMax
	var parY = par.substring(4,8);			//YMin;YMid;YMax;
	var ma = par.split(" ");
	var mos = ma[1];						//meet;slice

	//get dimensions of the viewport
	sCTM.a = 1;
	sCTM.d = 1;
	sCTM.e = 0;
	sCTM.f = 0;

	var w = theElement.getAttribute("width");
	if (w == null || w == "") {
		w = window.innerWidth;
	}

	h = theElement.getAttribute("height");
	if (h == null || h == "") {
		h = window.innerHeight;
	}

	// Jeff Schiller:  Modified to account for percentages - I'm not 
	// absolutely certain this is correct but it works for 100%/100%
	var ws = ""+w;
	if (ws.substr(ws.length-1, 1) == "%") {
		w = (parseFloat(ws.substr(0,ws.length-1)) / 100.0) * innerWidth;
	}
	var hs = ""+h;
	if (hs.substr(hs.length-1, 1) == "%") {
		h = (parseFloat(hs.substr(0,hs.length-1)) / 100.0) * innerHeight;
	}

	// get the ViewBox
	var vba = theElement.getAttribute("viewBox");
	if (vba == null) {
		vba = "0 0 " + w + " " + h;
	}
	var vb = vba.split(" ");			//get the viewBox into an array

	//--------------------------------------------------------------------------
	//create a matrix with current user transformation
	tr.a = producer.currentScale;			// ie: type mismatch
	tr.d = producer.currentScale;
	tr.e = producer.currentTranslate.x;
	tr.f = producer.currentTranslate.y;

	//scale factors
	var sx = w/vb[2];
	var sy = h/vb[3];

	//meetOrSlice
	var s;
	if (mos == "slice") {
		s = (sx>sy ? sx:sy);
	} else {
		s = (sx<sy ? sx:sy);
	}

	//preserveAspectRatio="none"
	if (par == "none") {
		sCTM.a=sx;					//scaleX
		sCTM.d=sy;					//scaleY
		sCTM.e=- vb[0]*sx;			//translateX
		sCTM.f=- vb[0]*sy;			//translateY
		sCTM=tr.multiply(sCTM);		//taking user transformations into acount

		return sCTM;
	}

	sCTM.a = s;						//scaleX
	sCTM.d = s;						//scaleY
	//-------------------------------------------------------
	switch (parX) {
	case "xMid":
		sCTM.e = ((w-vb[2]*s)/2) - vb[0]*s; //translateX
		break;
	case "xMin":
		sCTM.e = - vb[0]*s;					//translateX
		break;
	case "xMax":
		sCTM.e = (w-vb[2]*s)- vb[0]*s;		//translateX
		break;
	}
	//------------------------------------------------------------
	switch (parY) {
	case "YMid":
		sCTM.f = (h-vb[3]*s)/2 - vb[1]*s;	//translateY
		break;
	case "YMin":
		sCTM.f=- vb[1]*s;					//translateY
		break;
	case "YMax":
		sCTM.f=(h-vb[3]*s) - vb[1]*s;		//translateY
		break;
	}
	sCTM = tr.multiply(sCTM);				//taking user transformations into acount

	return sCTM;
}

function screenToClient(el, x, y) {

	// var p = document.documentElement.createSVGPoint();
	var p = svg.createSVGPoint();

	p.x = x;
	p.y = y;

	var m = getScreenCTM(el.parentNode);

	p = p.matrixTransform(m.inverse());

	return p;
}
