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






