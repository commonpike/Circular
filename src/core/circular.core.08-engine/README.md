#Circular.engine#

*description:*

> The engine processes the document. It starts at a few root nodes, and cycles down, depth-first, parsing the content looking for expressions, invoking module methods, etcetera. 
> It passes all information it finds to @registry, which in turn notifies @watchdog. If the watchdog sees anything change, it notifies @engine again. And hence it's Circular.
>
> As these cycles happen, you'd better not touch the document yourself, or you might end up in unpredictable situations. Instead, *Circular.queue()* your activities so they will be executed in between cycles, while Circular is sure to be idle.
>
> The engine module provides no attributes. All methods are for internal use.
>


----

##config##

----

*example:* 

	Circular.init({rootselector:'.circular-root'})

*arguments:*

- **rootselector:** (*type:* string, *default:* '[cc-root],[data-cc-root]')

  jQuery selector defining the root nodes to start the first cycle with.


----

##methods##

*internal methods not documented*

----

###@engine.start()

*description:*

> This starts the cycle. It is only called once, by Circular.init()





