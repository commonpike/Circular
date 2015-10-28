#jQuery Circular#
##Data binding for the masses##

Circular is a modular library that implements {{inline}} javascript expressions, with data-binding, and custom attributes. It was designed for simplicity and extensibility. And fun.

It uses [jQuery](http://jquery.org) for traversing the document, [Esprima](http://esprima.org/) for parsing expressions and [Observe.js](https://github.com/polymer/observe-js) for data-binding.

> This is very much in alpha state. I don't know how you got here, but hey, I'm still just building this :-)

----

###Getting started

- Include jQuery. 
- Include [Circular](https://github.com/commonpike/Circular/tree/master/dist/js). 
- If needed, include additional modules
- Add a `cc-root` tag somewhere to tell Circular where to cycling


		<html>
			<head>
				<script src="http://code.jquery.com/jquery-1.11.3.min.js"></script>
				<script src="Circular.min.js"></script>
				<script src="circular.alert.js"></script>
			</head>
			<body cc-root>
				<div cc-alert="{{new Date()}}">What time is it ?</div> 
			</body>
		</html>

Circular will traverse the document, starting at cc-root, depth-first, and evaluate all expressions and execute all custom attributes it finds on its way. The engine will pass what it has found to the registry. The registry passes it on to the watchdog. If anything changes, the watchdog returns those changes to the engine and the cycle starts again.

----

###Expressions

Everything written within {{moustaches}} is evaluated with javascript and replaced by its result. 
Variables involved in the expression will be watched and results will be updated as they change.

*example:* 

    <script>
      var page = { 
        title : 'example',
        link  : '#xmp'
      }
    </script>
    ..
    <body cc-root>
      <a href="{{page.link}}">{{page.title}}</a>
    </body>
    
The *context* module keeps track of a data-context while traversing the document, 
allowing you to write relative paths to your data using a hash (#) sign:

*example:* 

    <body cc-root cc-context="page">
      <a href="{{#link}}">{{#title}}</a>
    </body>

Similarly, the 'at' sign (@), allows you to write relative paths within Circular 
and its modules:

*example:* 

    <span>Version: {{@config.version}}</span>
    
----

###CC Attributes

Circular modules define attributes that execute code while Circular is traversing the 
document. You've already seen `cc-root` (the root module) and `cc-context` (the
context module). Other examples are cc-debug, cc-content, cc-hide, etc. Some
modules are included by default, some are available as addons.

*example:* 

	<a href="rooms.html" cc-hide="{{#rooms.length<2}}">Rooms for rent</a>

If you dislike the `cc-` style of attributing, you can use `data-cc-` too, which
is valid html5.

----

###Circular Modules

Everything in Circular is a module. It's really easy to boil your
own. This code:

	new CircularModule({
		name	: 'alert',
	  	in	: function(attr,node,props) {
			  alert('in: '+attr.value)
		},
	  	out	: function(attr,node,props) {
	  		alert('out: '+attr.value)
	  	}	
  	});

will create support for an attribute `cc-alert` that will alert it's
value twice while traversing the node: once while entering it (`in()`)
and once while leaving it (`out()`):

	<div cc-alert="{{new Date()}}">What time is it ?</div> 

Additionally, this module would be available as `Circular.alert` in javascript,
and hence an expression like

	{{@alert.name}}
	
would print `alert` within your html code.
