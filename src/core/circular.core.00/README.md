#Circular#

*description:*

> The Circular 'root' is very small. It contains a few methods to load the modules, manage a queue, and initialize itself. 
>
> By default, Circular.init() is called on `$(document).ready()`. You can call it anytime earlier with configuration options (eg `Circular.init({debug:true})`); but it will still wait on `$(document).ready()` before processing the document. After initializing, it checks if it has an engine and starts that. 
>
> That is all. All the real work happens inside modules: the **@engine** module processes the document, passes the results to the **@registry** module, which notifies the **@watchdog** module. If the watchdog sees changes happening, it waits until queue is finished, processes the changes and passes them back to the @engine. And so it cycles.
>
> As these cycles happen, you'd better not touch the document yourself, or you might end up in unpredictable situations. Instead, *Circular.queue()* your activities so they will be executed in between cycles, while Circular is sure to be idle.
>

----

##Circular core methods##

*internal methods not documented*

----

###Circular.init({options})

*example:*

  Circular.init({
	  debug : true,
	  foo   : 'bar'
  })
	  
*description:*

> Call this before $(document).ready(), or disable `autoinit` and call it later (see config below). All modules have config options, and they are all read from this single init() call. For example, the 'debug' option in the example is provided by the @debug module. 

----

###Circular.queue(func)

*example:*

	Circular.queue(function() { rewriteFooStuff('#foo'); });
	Circular.queue(function() { alert('done!'); });
  
*description:*

> Add `func` to the queue. Methods in the queue are executed one by one, first in, first out. Circulars 'cycle' uses the queue, so adding your own method here ensures that Circular is idle when your method executes.

----

##Circular core classes##

----

###new CircularModule({def})

*example:*

	new CircularModule({
		name	: 'alert',
		in		: function(ccattr,node,ccnode) {
			alert('in: '+ccattr.value)
		},
		out		: function(ccattr,node,ccnode) {
			alert('out: '+ccattr.value)
		}
	});

	  
*description:*

> A Circular module becomes an integral part of Circular after it initializes. A module named 'foo' by default represents an attribute named 'cc-foo' and can provide methods and properties accessible via Circular expressions like `{{@foo.bar}}``, or in vanilla javascript as `Circular.foo.bar`.
>
> Circular modules should be created before Circular initializes, and the creation order is important. 

*methods:*

	in		: function(ccattr,node,ccnode)
	out		: function(ccattr,node,ccnode)

*arguments:*

- **ccattr:** (*type:* object)
	an object describing the attribute that triggered this method. see the
	registry module for a detailed description of its format

- **node:** (*type:* html dom node)
	the node containing the attribute

- **ccnode:** (*type:* object)
	'live' properties of the node as they are being processed

*return value:*

	boolean false or undefined


*description:*

> While Circular processes the document, it looks at all attributes of all nodes to see if they contain expression and/or refer to a module. The attributes are sorted:  module attributes first, in the order in which they were created, than any other attributes. The order is relevant, because some attributes (like cc-context) can influence others.
>
> Circular then loops the attributes in that order and execute the `in()` method. 
>
> If in() does not return false, Circular will continue with the next attribute, and traverse into the node, depth-first, to process its children. Eventually it will bubble up and encounter your node again. It will process the same attributes as it did on the way in, but now in reverse order, and execute the `out()` method. 
>
> If in() does return (real boolean) false, Circular will not process the remaining attributes and not traverse into the node. It will loop the attributes it already processed in reverse order and execute `out()`.
>
> There is only one instance of your module, which may handle several nodes in the document. If you need to remember data related to the node, for example to reuse on the way out(), be sure to relate the node to that data. `$(node).data()` is your friend.





----

----

##Circular core config##

----
	
*example:* 
	
	Circular.init({
		dataprefix	: 'data-',
		autoinit	: true
	})


*arguments:*


- **dataprefix:** (*type:* string, *default:* 'data-')

The string to prefix to an custom attribute to make it valid html5

- **autoinit:** (*type:* boolean, *default:* true)

Wether to start Circular on `$(document).ready()` by itself. Example:
  
	Circular.config.autoinit=false;
	$(document).on('kp-loaded',function() {
	  Circular.init({dataprefix:'kp-'})
	});






