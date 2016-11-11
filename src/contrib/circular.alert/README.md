#Circular.alert#

*author:* pike; *version:* 1.0; *requires:* Circular

----

##attributes##

----

###cc-alert, data-cc-alert

*example:* 

``<div cc-alert='foo'></div>``

*description:*

> While processing, when circular encounters this attribute
> it will alert the value of the attribute. That is fairly
> useless, but the purpose of this module is just to be an
> example for module builders :-)

----

##methods##

----

###@alert.in(ccattr,ccnode,node)

*description:*

>processes the attribute on the way in
	
*arguments:*
	
- **ccattr:** information about the current attribute
- **node:** the current html dom node
- **ccnode:** circular properties of the current node
			
*return value:* 

- undefined
		
----

###@alert.out(ccattr,ccnode,node)

*description:*
>processes the attribute on the way out
	
*arguments:*
	
- **ccattr:** information about the current attribute
- **node:** the current html dom node
- **ccnode:** circular properties of the current node
			
*return value:* 

- undefined