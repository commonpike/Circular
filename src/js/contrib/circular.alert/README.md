#Circular.alert#

----

##attributes##

----

###cc-alert, data-cc-alert

*example:* 

``<div cc-alert='foo'>``

*description:*

> While processing, when circular encounters this attribute
> it will alert the value of the attribute. That is fairly
> useless, but the purpose of this module is just to be an
> example for module builders :-)

----

##methods##

----

###@cc-alert.in(attr,node,props)

*description:*
>processes the attribute on the way in
	
*arguments:*
	
- **attr:** information about the current attribute
- **node:** the current html dom node
- **props:** circular properties of the current node
			
*return value:* 

- undefined
		
###@cc-alert.out(attr,node,props)

*description:*
>processes the attribute on the way out
	
*arguments:*
	
- **attr:** information about the current attribute
- **node:** the current html dom node
- **props:** circular properties of the current node
			
*return value:* 

- undefined