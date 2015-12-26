#Circular.log#

*author:* pike; *version:* 1.0

*description:*

> A general logging utility, part of Circular core. Use this in your own module to log warnings or fatal messages. For debugging, consider using Circular.debug instead.

----

##attributes##

----

###cc-log, data-cc-log

*example:* 

``<div cc-log='foo'></div>``

*description:*

> Writes the value of the attribute to the console using console.info().

----

##methods##

----

###@log.write(arguments)

*description:*

> Writes arguments to the console using console.log().
	
###@log.info(arguments)

*description:*

> Writes arguments to the console using console.info().
	
	
###@log.warn(arguments)

*description:*

> Writes arguments to the console using console.warn().
	
###@log.error(arguments)

*description:*

> Writes arguments to the console using console.error().
	
	
###@log.fatal(arguments)

*description:*

> Writes arguments to the console using console.fatal(). 
> Calls `Circular.die()` when done, which eventually blocks further processing.
	


