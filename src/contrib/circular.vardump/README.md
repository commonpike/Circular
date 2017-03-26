#Circular.vardump#

----

##custom attributes##

----

###cc-vardump

*example:* 

		<div id="songs" cc-vardump="{{@songbook.allsongs}}">
			loading ...
		</div>
	

*description:*

> The module replaces the content of the node with a JSON.stringify()d version of the argument
>
----

##executable comments##

----

###cc:vardump

*example:* 

		<div id="songs">
			<!--cc:vardump({{@songbook.allsongs}})-->
		</div>

*description:*

> The module replaces comment with a <xmp> tag filled with a JSON.stringify()d version of the argument
>

----

##config##

----

###replacer,space

*example:* 

		Circular.init({
			vardump	: {
				replacer 	: ['week', 'month'],
				space			: 8
			}
		})

*description:*

> Arguments used to JSON.stringify() the content
>