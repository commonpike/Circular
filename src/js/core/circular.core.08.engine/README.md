#Circular.engine#

*description:*

> The engine processes the document. It cycles down the document, starting nodes marked *cc-root*, depth-first,  parsing the document looking for expressions, invoking modules method, etcetera. 
> It passes all information it finds to @registry, which in turn notifies @watchdog. If the watchdog sees anything change, it notifies @engine again. And so it's Circular.
>
> As these cycles happen, you should not touch the document yourself, or you might end up in unpredictable situations. Instead, *queue* your activities and they will be executed between these cycles, while Circular is idle.
>
> The engine module provides no attributes and has no config. Most methods are for internal use.
>



----

##methods##

*internal methods not documented*

----

###@engine.start()

*description:*

> This starts the cycle. It is only called once, by Circular.init()



###@engine.queue(func)

*description:*

> Queue the function to be executed as soon as the engine has time
	

###@engine.sort(nodes)

*arguments:*

- **nodes:** (*type:* array of dom nodes) 
The nodes to sort

> Sort the given array of dom nodes so, that parent nodes always appear before their child nodes.
	


