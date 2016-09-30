#Circular.monitor#

*author:* pike; *version:* 1.0; *requires:* Circular

----

##attributes##

----

###cc-monitor, data-cc-monitor

*example:* 

``<div cc-monitor='{{@debug.enabled}}'></div>``

*description:*

> monitor

----

##methods##

----

###@monitor.in(attr,node,props)

*description:*

>processes the attribute on the way in
	
*arguments:*
	
- **attr:** information about the current attribute
- **node:** the current html dom node
- **props:** circular properties of the current node
			
*return value:* 

- undefined
		
----

###@monitor.out(attr,node,props)

*description:*
>processes the attribute on the way out
	
*arguments:*
	
- **attr:** information about the current attribute
- **node:** the current html dom node
- **props:** circular properties of the current node
			
*return value:* 

- undefined