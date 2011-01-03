// firebug debug console

// FF		: Mozilla
// IE		: ""
// batik	: navigator not defined
// Safari	: Mozilla
// Opera	: Mozilla
// alert (navigator.appCodeName);

// FF		: ""
// IE		: ""
// batik	: navigator not defined
// Safari	: Apple Computer Inc.
// Opera	: undefined
// alert (navigator.vendor);

// FF		: Mozilla/5.0 (Windows; U; Windows NT 5.1; de; rv:1.9.2.10) Gecko/20100914 Firefox/3.6.10 (.NET CLR 3.5.30729)
// IE		: ""
// batik	: navigator not defined
// Safari	: Mozilla 5.0 ....
// Opera	: Oper 9.8 ...
// alert (navigator.userAgent);

// FF		: Netscape
// IE		: Adobe SVG Viewer
// batik	: navigator not defined
// Safari	: Netscape
// Opera	: Opera
// alert (navigator.appName);

// FF		: 5.0 Windows
// IE		: 3.03
// batik	: ...
// Safari	: 5.0 .....
// Opera	: 9.80 (Windows NT 5.1; U; en)
// alert (navigator.appVersion);

// FF		: 
// IE		: 
// batik	: 
// Safari	: 
// Opera	: 
// alert ();



if (window['loadFirebugConsole']) {
	window.loadFirebugConsole();
	// dgbOut = function(){window.console.info(str)};
	// dgbOut = function(){window.console.info()};
	// dgbOut = window.console.info;
} else if (!window['console']) {
	window.console = {};
	window.console.info =
	window.console.log =
	window.console.warn =
	window.console.error = function(){}
}
