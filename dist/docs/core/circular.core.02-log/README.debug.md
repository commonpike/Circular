#Circular.debug#

*description:*

> A debugging utility, part of Circular core. If debugging is enabled, this passes all calls to `@debug.write()` to `@log.write()`, generally making it appear in your console. 

----

##config##

----

*example:* 

``Circular.init({debug:true})``

*arguments:*

- **debug:** (*type:* boolean, *default:* false) 
wether to turn debug on by default. 


----

##attributes##

----

###cc-debug, data-cc-debug

*example:* 

``<div cc-debug='false'></div>``

*description:*

> Toggles debugging on for this node and below. The value of the attribute is `boolish` as determined by *Circular.parser*: eg. an empty string is true and the string 'off' is false.

----

##methods##

----

###@debug.toggle(state)

*arguments:*

- **state:** (*type:* boolean, *default:* undefined) 
the state to put debugging in 
 
 
*description:*

> Toggles debugging into the given state: on (true), off (false), or whatever it is not now (undefined)
	

	
###@debug.write(arguments)

*description:*

> If debugging is on, passes all arguments to `@log.write`
	
----

##properties##

----

###@debug.enabled

*type:* boolean

*description:*

> Wether debug is enabled or not



