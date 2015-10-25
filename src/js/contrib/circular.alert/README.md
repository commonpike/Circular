#Circular module: alert

##attributes

###cc-alert
###data-cc-alert

	*example:* ``<div cc-alert='foo'>``

	*description:*
	while processing, if circular encounters this attribute
	on the way in, it will alter the value of the attribute
	
##functions

###@cc-alert.in(attr,node,props)

	*description:*
	processes the attribute on the way in
	
	*arguments:*
	
		- *attr*
			information about the current attribute
		- *node*
			the current html dom node
		- *props*
			circular properties of the current node
			
		
	*return:*
	
		undefined
		
###@cc-alert.out(attr,node,props)

	*arguments:*
	processes the attribute on the way out
	
		- *attr*
			information about the current attribute
		- *node*
			the current html dom node
		- *props*
			circular properties of the current node
			
		
	*return:*
	
		undefined