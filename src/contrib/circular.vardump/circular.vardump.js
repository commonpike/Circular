
/* ----------------------
	Circular.vardump
----------------------- */

new CircularModule('vardump',{
	
	config				: {
		replacer	: undefined,
		space			: 4
	},
	settings 			: {
		insertcss		: [
			'[cc-vardump], xmp.cc-vardump {  }'
		]
	},

	attributes		: {
		'cc-vardump' : {
			in		: function(ccattr,ccnode,node) {
				var val = ccattr.content.value;
				Circular.log.debug('@vardump','attributes.vardump.in','setting content',val);
				var dump = JSON.stringify(val,Circular.vardump.config.replacer,Circular.vardump.config.space);
				//node.innerHTML='<xmp class="cc-vardump">'+dump+'</xmp>';
				node.textContent=dump;
			},
			insert	: function(ccattr,ccnode,node) {
				Circular.log.debug('@vardump','attributes.vardump.insert','ignore');
			}			
		}
	},
	comments	: {
		'vardump'	: function(comment,arg) {
			var dump = JSON.stringify(arg,Circular.vardump.config.replacer,Circular.vardump.config.space);
			var xmp = document.createElement('xmp');
			xmp.setAttribute('class','cc-vardump');
			xmp.textContent=dump;
			comment.parentNode.insertBefore(xmp,comment);
			comment.parentNode.removeChild(comment);
		}
	}
	
		
});
